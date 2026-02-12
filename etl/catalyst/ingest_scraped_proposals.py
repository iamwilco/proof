import logging
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Iterable, Optional

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, MetaData, String, Table, Text, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB, insert

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("catalyst.ingest.scraped")

metadata = MetaData()

scraped_proposals = Table(
    "catalyst_scraped_proposals",
    metadata,
    Column("id", String, primary_key=True),
    Column("fund_url", String, nullable=False),
    Column("proposal_url", String, nullable=False, unique=True),
    Column("fund_slug", String, nullable=True),
    Column("proposal_slug", String, nullable=True),
    Column("title", String(500), nullable=True),
    Column("summary", Text, nullable=True),
    Column("body", Text, nullable=True),
    Column("raw_html", Text, nullable=True),
    Column("raw_payload", JSONB, nullable=True),
    Column("scraped_at", DateTime(timezone=True), nullable=False),
)

funds = Table(
    "Fund",
    metadata,
    Column("id", String, primary_key=True),
    Column("externalId", String),
    Column("name", String),
    Column("number", String),
    Column("slug", String),
    Column("status", String),
    Column("currency", String),
    Column("totalBudget", String),
    Column("totalAwarded", String),
    Column("totalDistributed", String),
    Column("proposalsCount", String),
    Column("fundedProposalsCount", String),
    Column("completedProposalsCount", String),
    Column("startDate", DateTime(timezone=True)),
    Column("endDate", DateTime(timezone=True)),
    Column("sourceUrl", String),
    Column("sourceType", String),
    Column("lastSeenAt", DateTime(timezone=True)),
    Column("createdAt", DateTime(timezone=True)),
    Column("updatedAt", DateTime(timezone=True)),
)

projects = Table(
    "Project",
    metadata,
    Column("id", String, primary_key=True),
    Column("externalId", String),
    Column("fundId", String),
    Column("title", String),
    Column("slug", String),
    Column("description", Text),
    Column("problem", Text),
    Column("solution", Text),
    Column("experience", Text),
    Column("category", String),
    Column("status", String),
    Column("fundingStatus", String),
    Column("fundingAmount", String),
    Column("amountReceived", String),
    Column("currency", String),
    Column("yesVotes", String),
    Column("noVotes", String),
    Column("fundedAt", DateTime(timezone=True)),
    Column("website", String),
    Column("sourceUrl", String),
    Column("sourceType", String),
    Column("lastSeenAt", DateTime(timezone=True)),
    Column("createdAt", DateTime(timezone=True)),
    Column("updatedAt", DateTime(timezone=True)),
)


def get_engine():
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")
    return create_engine(database_url)


def extract_fund_number(fund_url: str) -> Optional[int]:
    match = re.search(r"/funds/(\d+)", fund_url)
    return int(match.group(1)) if match else None


def resolve_fund_id(connection, fund_url: str, fund_slug: Optional[str]) -> str:
    now = datetime.now(timezone.utc)
    fund_number = extract_fund_number(fund_url)

    existing = None
    if fund_number is not None:
        existing = connection.execute(
            select(funds.c.id).where(funds.c.number == str(fund_number))
        ).scalar_one_or_none()

    if existing:
        connection.execute(
            funds.update().where(funds.c.id == existing).values(lastSeenAt=now)
        )
        return existing

    fund_id = str(uuid.uuid4())
    fund_name = f"Fund {fund_number}" if fund_number else "Unknown Fund"
    connection.execute(
        funds.insert().values(
            id=fund_id,
            externalId=str(fund_number) if fund_number else None,
            name=fund_name,
            number=str(fund_number or 0),
            slug=fund_slug,
            status="active",
            currency="USD",
            totalBudget="0",
            totalAwarded="0",
            totalDistributed="0",
            proposalsCount="0",
            fundedProposalsCount="0",
            completedProposalsCount="0",
            sourceUrl=fund_url,
            sourceType="catalyst_scrape",
            lastSeenAt=now,
            createdAt=now,
            updatedAt=now,
        )
    )
    return fund_id


def upsert_project(connection, fund_id: str, row: dict) -> None:
    now = datetime.now(timezone.utc)
    proposal_url = row.get("proposal_url")
    existing_id = connection.execute(
        select(projects.c.id).where(projects.c.sourceUrl == proposal_url)
    ).scalar_one_or_none()

    description = row.get("summary") or row.get("body") or ""
    title = row.get("title") or "Untitled"

    payload = {
        "externalId": None,
        "fundId": fund_id,
        "title": title,
        "slug": row.get("proposal_slug"),
        "description": description,
        "problem": None,
        "solution": None,
        "experience": None,
        "category": "Uncategorized",
        "status": "unknown",
        "fundingStatus": "pending",
        "fundingAmount": "0",
        "amountReceived": "0",
        "currency": "USD",
        "yesVotes": "0",
        "noVotes": "0",
        "fundedAt": None,
        "website": None,
        "sourceUrl": proposal_url,
        "sourceType": "catalyst_scrape",
        "lastSeenAt": now,
        "createdAt": now,
        "updatedAt": now,
    }

    if existing_id:
        payload.pop("createdAt", None)
        payload["updatedAt"] = now
        connection.execute(
            projects.update().where(projects.c.id == existing_id).values(**payload)
        )
    else:
        payload["id"] = str(uuid.uuid4())
        connection.execute(projects.insert().values(**payload))


def fetch_scraped_rows(connection, fund_url: Optional[str] = None) -> Iterable[dict]:
    stmt = select(scraped_proposals)
    if fund_url:
        stmt = stmt.where(scraped_proposals.c.fund_url == fund_url)
    return connection.execute(stmt).mappings().all()


def run(fund_url: Optional[str] = None) -> None:
    engine = get_engine()
    metadata.create_all(engine)
    with engine.begin() as connection:
        rows = fetch_scraped_rows(connection, fund_url)
        if not rows:
            logger.info("No scraped proposals found")
            return

        logger.info("Ingesting %s scraped proposals", len(rows))
        for row in rows:
            fund_id = resolve_fund_id(connection, row.get("fund_url"), row.get("fund_slug"))
            upsert_project(connection, fund_id, row)

    logger.info("Scraped proposal ingestion complete")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Ingest scraped Catalyst proposals")
    parser.add_argument("--fund-url", help="Filter ingestion to a specific fund URL")
    args = parser.parse_args()

    run(args.fund_url)
