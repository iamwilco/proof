import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, MetaData, String, Table, create_engine, select
from sqlalchemy.dialects.postgresql import ARRAY

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("catalyst.ingest.milestones")

metadata = MetaData()

projects = Table(
    "Project",
    metadata,
    Column("id", String, primary_key=True),
    Column("externalId", String),
)

milestones = Table(
    "Milestone",
    metadata,
    Column("id", String, primary_key=True),
    Column("projectId", String, nullable=False),
    Column("title", String, nullable=False),
    Column("dueDate", DateTime(timezone=True), nullable=True),
    Column("status", String, nullable=False),
    Column("catalystMilestoneId", String, nullable=True),
    Column("somStatus", String, nullable=True),
    Column("poaStatus", String, nullable=True),
    Column("poaSubmittedAt", DateTime(timezone=True), nullable=True),
    Column("poaApprovedAt", DateTime(timezone=True), nullable=True),
    Column("reviewerFeedback", String, nullable=True),
    Column("paymentStatus", String, nullable=True),
    Column("paymentTxHash", String, nullable=True),
    Column("evidenceUrls", ARRAY(String), nullable=False),
    Column("sourceUrl", String, nullable=False),
    Column("sourceType", String, nullable=False),
    Column("lastSeenAt", DateTime(timezone=True), nullable=False),
    Column("createdAt", DateTime(timezone=True), nullable=False),
    Column("updatedAt", DateTime(timezone=True), nullable=False),
)


def get_engine() -> Any:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required to run milestone ingestion")
    return create_engine(database_url)


def parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def load_payload(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, list):
        raise ValueError("Milestone payload must be a list of milestone records")
    return payload


def build_project_lookup(connection) -> Dict[str, str]:
    lookup: Dict[str, str] = {}
    rows = connection.execute(select(projects.c.id, projects.c.externalId)).mappings()
    for row in rows:
        if row["externalId"]:
            lookup[str(row["externalId"])] = row["id"]
    return lookup


def find_existing_milestone(connection, project_id: str, record: Dict[str, Any]) -> Optional[str]:
    catalyst_id = record.get("catalyst_milestone_id")
    if catalyst_id:
        existing = connection.execute(
            select(milestones.c.id).where(milestones.c.catalystMilestoneId == catalyst_id)
        ).scalar_one_or_none()
        if existing:
            return existing

    title = record.get("title")
    due_date = parse_datetime(record.get("due_date"))
    stmt = select(milestones.c.id).where(
        milestones.c.projectId == project_id,
        milestones.c.title == title,
    )
    if due_date is not None:
        stmt = stmt.where(milestones.c.dueDate == due_date)
    return connection.execute(stmt).scalar_one_or_none()


def build_row(project_id: str, record: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    return {
        "projectId": project_id,
        "title": record.get("title") or "Untitled Milestone",
        "dueDate": parse_datetime(record.get("due_date")),
        "status": record.get("status") or "pending",
        "catalystMilestoneId": record.get("catalyst_milestone_id"),
        "somStatus": record.get("som_status"),
        "poaStatus": record.get("poa_status"),
        "poaSubmittedAt": parse_datetime(record.get("poa_submitted_at")),
        "poaApprovedAt": parse_datetime(record.get("poa_approved_at")),
        "reviewerFeedback": record.get("reviewer_feedback"),
        "paymentStatus": record.get("payment_status"),
        "paymentTxHash": record.get("payment_tx_hash"),
        "evidenceUrls": record.get("evidence_urls") or [],
        "sourceUrl": record.get("source_url") or "manual",
        "sourceType": record.get("source_type") or "catalyst_milestone_manual",
        "lastSeenAt": now,
        "createdAt": now,
        "updatedAt": now,
    }


def upsert_milestones(rows: List[Dict[str, Any]], project_lookup: Dict[str, str]) -> None:
    if not rows:
        logger.info("No milestones provided")
        return

    engine = get_engine()
    metadata.create_all(engine)

    inserted = 0
    updated = 0

    with engine.begin() as connection:
        for record in rows:
            external_id = record.get("project_external_id")
            if not external_id:
                logger.warning("Skipping milestone without project_external_id")
                continue

            project_id = project_lookup.get(str(external_id))
            if not project_id:
                logger.warning("No project match for external id %s", external_id)
                continue

            row = build_row(project_id, record)
            existing_id = find_existing_milestone(connection, project_id, record)

            if existing_id:
                row.pop("createdAt", None)
                row["updatedAt"] = datetime.now(timezone.utc)
                connection.execute(
                    milestones.update().where(milestones.c.id == existing_id).values(**row)
                )
                updated += 1
            else:
                row["id"] = record.get("milestone_id") or f"milestone_{external_id}_{inserted}"
                connection.execute(milestones.insert().values(**row))
                inserted += 1

    logger.info("Milestone ingestion complete. Inserted %s, updated %s", inserted, updated)


def run(payload_path: str) -> None:
    engine = get_engine()
    with engine.begin() as connection:
        project_lookup = build_project_lookup(connection)

    rows = load_payload(payload_path)
    upsert_milestones(rows, project_lookup)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Ingest Catalyst milestone data from JSON")
    parser.add_argument("--payload", required=True, help="Path to milestone JSON payload")
    args = parser.parse_args()

    run(args.payload)
