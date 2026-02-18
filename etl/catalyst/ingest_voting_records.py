import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List

import requests
from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Float, Integer, MetaData, String, Table, create_engine, select
from sqlalchemy.dialects.postgresql import insert

BASE_URL = "https://www.catalystexplorer.com/api/v1"
PROPOSALS_ENDPOINT = f"{BASE_URL}/proposals"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("catalyst.ingest.voting")

metadata = MetaData()

projects = Table(
    "Project",
    metadata,
    Column("id", String, primary_key=True),
    Column("externalId", String),
    Column("fundId", String),
    Column("category", String),
)

funds = Table(
    "Fund",
    metadata,
    Column("id", String, primary_key=True),
    Column("number", Integer),
)

voting_records = Table(
    "VotingRecord",
    metadata,
    Column("id", String, primary_key=True),
    Column("projectId", String, nullable=False),
    Column("fundId", String, nullable=False),
    Column("category", String, nullable=False),
    Column("yesVotes", Integer, nullable=False),
    Column("noVotes", Integer, nullable=False),
    Column("abstainVotes", Integer, nullable=False),
    Column("uniqueWallets", Integer, nullable=False),
    Column("approvalRate", Float, nullable=False),
    Column("fundingProbability", Float, nullable=False),
    Column("fundRank", Integer, nullable=True),
    Column("categoryRank", Integer, nullable=True),
    Column("sourceUrl", String, nullable=False),
    Column("sourceType", String, nullable=False),
    Column("capturedAt", DateTime(timezone=True), nullable=False),
    Column("createdAt", DateTime(timezone=True), nullable=False),
    Column("updatedAt", DateTime(timezone=True), nullable=False),
)


def get_engine() -> Any:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required to run voting ingestion")
    return create_engine(database_url)


def _get_with_retry(params: Dict[str, Any], retries: int = 3, backoff: float = 1.5) -> Dict[str, Any]:
    attempt = 0
    while True:
        attempt += 1
        try:
            response = requests.get(PROPOSALS_ENDPOINT, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            if attempt >= retries:
                raise
            wait = backoff ** attempt
            logger.warning("Request failed (attempt %s/%s): %s. Retrying in %.1fs", attempt, retries, exc, wait)
            time.sleep(wait)


def fetch_proposals(per_page: int = 60) -> Iterable[Dict[str, Any]]:
    page = 1
    while True:
        payload = _get_with_retry({"per_page": per_page, "page": page})
        data = payload.get("data") or []
        if not data:
            break
        logger.info("Fetched %s proposals from page %s", len(data), page)
        for item in data:
            yield item
        page += 1


def resolve_category(raw: Dict[str, Any]) -> str:
    return (
        raw.get("challenge_title")
        or raw.get("challenge")
        or raw.get("category")
        or "Uncategorized"
    )


def build_records(engine: Any) -> List[Dict[str, Any]]:
    fund_lookup = {}
    with engine.begin() as connection:
        for row in connection.execute(select(funds.c.id, funds.c.number)).mappings():
            if row["number"] is not None:
                fund_lookup[int(row["number"])] = row["id"]

    project_lookup = {}
    with engine.begin() as connection:
        for row in connection.execute(select(projects.c.id, projects.c.externalId, projects.c.fundId, projects.c.category)).mappings():
            if row["externalId"]:
                project_lookup[str(row["externalId"])] = row

    rows = []
    captured_at = datetime.now(timezone.utc)

    for proposal in fetch_proposals():
        proposal_id = str(proposal.get("id"))
        if proposal_id not in project_lookup:
            continue

        project = project_lookup[proposal_id]
        fund_number = proposal.get("fund_id")
        fund_id = project["fundId"] or (
            fund_lookup.get(int(fund_number)) if fund_number is not None else None
        )
        if not fund_id:
            continue

        yes_votes = int(proposal.get("yes_votes_count") or 0)
        no_votes = int(proposal.get("no_votes_count") or 0)
        abstain_votes = int(proposal.get("abstain_votes_count") or 0)
        total_cast = yes_votes + no_votes
        approval_rate = yes_votes / total_cast if total_cast > 0 else 0.0

        rows.append(
            {
                "id": f"vote_{proposal_id}_{int(captured_at.timestamp())}",
                "projectId": project["id"],
                "fundId": fund_id,
                "category": resolve_category(proposal) or project.get("category") or "Uncategorized",
                "yesVotes": yes_votes,
                "noVotes": no_votes,
                "abstainVotes": abstain_votes,
                "uniqueWallets": int(proposal.get("unique_wallets") or 0),
                "approvalRate": approval_rate,
                "fundingProbability": approval_rate,
                "fundRank": None,
                "categoryRank": None,
                "sourceUrl": proposal.get("url") or f"{PROPOSALS_ENDPOINT}/{proposal_id}",
                "sourceType": "catalyst_explorer",
                "capturedAt": captured_at,
                "createdAt": captured_at,
                "updatedAt": captured_at,
            }
        )

    return rows


def assign_rankings(rows: List[Dict[str, Any]]) -> None:
    fund_groups: Dict[str, List[Dict[str, Any]]] = {}
    category_groups: Dict[str, List[Dict[str, Any]]] = {}

    for row in rows:
        fund_groups.setdefault(row["fundId"], []).append(row)
        category_key = f"{row['fundId']}::{row['category']}"
        category_groups.setdefault(category_key, []).append(row)

    for group_rows in fund_groups.values():
        sorted_rows = sorted(group_rows, key=lambda r: r["yesVotes"], reverse=True)
        for rank, row in enumerate(sorted_rows, start=1):
            row["fundRank"] = rank

    for group_rows in category_groups.values():
        sorted_rows = sorted(group_rows, key=lambda r: r["yesVotes"], reverse=True)
        for rank, row in enumerate(sorted_rows, start=1):
            row["categoryRank"] = rank


def upsert_records(rows: List[Dict[str, Any]]) -> None:
    if not rows:
        logger.info("No voting records to upsert")
        return

    engine = get_engine()
    metadata.create_all(engine)

    with engine.begin() as connection:
        connection.execute(insert(voting_records).values(rows))

    logger.info("Upserted %s voting records", len(rows))


def run() -> None:
    engine = get_engine()
    rows = build_records(engine)
    assign_rankings(rows)
    upsert_records(rows)


if __name__ == "__main__":
    run()
