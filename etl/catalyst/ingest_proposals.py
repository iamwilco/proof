import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List
import time

import requests
from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Integer, MetaData, String, Table, Text, create_engine
from sqlalchemy.dialects.postgresql import JSONB, insert

BASE_URL = "https://www.catalystexplorer.com/api/v1"
PROPOSALS_ENDPOINT = f"{BASE_URL}/proposals"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("catalyst.ingest.proposals")

metadata = MetaData()

catalyst_proposals = Table(
    "catalyst_proposals",
    metadata,
    Column("proposal_id", Integer, primary_key=True),
    Column("fund_id", Integer, nullable=True),
    Column("challenge_id", Integer, nullable=True),
    Column("user_id", Integer, nullable=True),
    Column("title", String(500), nullable=True),
    Column("summary", Text, nullable=True),
    Column("status", String(100), nullable=True),
    Column("budget", String(100), nullable=True),
    Column("proposal_url", String(1000), nullable=True),
    Column("source_url", String(1000), nullable=False),
    Column("source_type", String(100), nullable=False),
    Column("last_seen_at", DateTime(timezone=True), nullable=False),
    Column("raw_payload", JSONB, nullable=False),
)


def get_engine() -> Any:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required to run ingestion")
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
        params = {"per_page": per_page, "page": page}
        try:
            payload = _get_with_retry(params)
        except requests.RequestException:
            if per_page > 24:
                logger.warning("Falling back to per_page=24 after repeated failures")
                per_page = 24
                continue
            raise
        data = payload.get("data") or []
        if not data:
            break
        logger.info("Fetched %s proposals from page %s", len(data), page)
        for item in data:
            yield item
        page += 1


def transform_proposal(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "proposal_id": raw.get("id"),
        "fund_id": raw.get("fund_id"),
        "challenge_id": raw.get("challenge_id"),
        "user_id": raw.get("user_id"),
        "title": raw.get("title"),
        "summary": raw.get("summary"),
        "status": raw.get("status"),
        "budget": raw.get("budget"),
        "proposal_url": raw.get("url"),
        "source_url": PROPOSALS_ENDPOINT,
        "source_type": "catalyst_explorer_api",
        "last_seen_at": datetime.now(timezone.utc),
        "raw_payload": raw,
    }


def upsert_proposals(rows: List[Dict[str, Any]]) -> None:
    if not rows:
        logger.info("No proposals to upsert")
        return
    engine = get_engine()
    metadata.create_all(engine)
    with engine.begin() as connection:
        stmt = insert(catalyst_proposals).values(rows)
        update_cols = {
            "fund_id": stmt.excluded.fund_id,
            "challenge_id": stmt.excluded.challenge_id,
            "user_id": stmt.excluded.user_id,
            "title": stmt.excluded.title,
            "summary": stmt.excluded.summary,
            "status": stmt.excluded.status,
            "budget": stmt.excluded.budget,
            "proposal_url": stmt.excluded.proposal_url,
            "source_url": stmt.excluded.source_url,
            "source_type": stmt.excluded.source_type,
            "last_seen_at": stmt.excluded.last_seen_at,
            "raw_payload": stmt.excluded.raw_payload,
        }
        connection.execute(stmt.on_conflict_do_update(index_elements=["proposal_id"], set_=update_cols))
    logger.info("Upserted %s proposals", len(rows))


def run() -> None:
    try:
        proposals = [transform_proposal(item) for item in fetch_proposals()]
        upsert_proposals(proposals)
    except requests.RequestException as exc:
        logger.exception("HTTP error while fetching proposals: %s", exc)
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error during proposal ingestion: %s", exc)
        raise


if __name__ == "__main__":
    run()
