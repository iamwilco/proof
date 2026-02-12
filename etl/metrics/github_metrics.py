import logging
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional, Tuple
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv
from sqlalchemy import JSON, Column, DateTime, Integer, MetaData, String, Table, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB, insert

GITHUB_API_BASE = "https://api.github.com"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("metrics.github")

metadata = MetaData()

github_metrics = Table(
    "github_repo_metrics",
    metadata,
    Column("id", String, primary_key=True),
    Column("link_id", String, nullable=False),
    Column("project_id", String, nullable=False),
    Column("repo_full_name", String, nullable=False),
    Column("stars", Integer, nullable=False),
    Column("forks", Integer, nullable=False),
    Column("open_issues", Integer, nullable=False),
    Column("watchers", Integer, nullable=False),
    Column("captured_at", DateTime(timezone=True), nullable=False),
    Column("source_url", String, nullable=False),
    Column("source_type", String, nullable=False),
    Column("raw_payload", JSONB, nullable=False),
)


def get_engine() -> Any:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required to run metrics")
    return create_engine(database_url)


def get_github_token() -> str:
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GITHUB_TOKEN is required to fetch GitHub metrics")
    return token


def parse_repo_from_url(url: str) -> Optional[str]:
    try:
        parsed = urlparse(url)
    except ValueError:
        return None
    if "github.com" not in parsed.netloc.lower():
        return None
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) < 2:
        return None
    return f"{parts[0]}/{parts[1]}"


def fetch_github_repo(repo: str, token: str, retries: int = 3) -> Dict[str, Any]:
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    url = f"{GITHUB_API_BASE}/repos/{repo}"

    for attempt in range(1, retries + 1):
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 403 and response.headers.get("X-RateLimit-Remaining") == "0":
            reset = int(response.headers.get("X-RateLimit-Reset", "0"))
            wait_seconds = max(1, reset - int(time.time()))
            logger.warning("Rate limit reached. Sleeping for %ss", wait_seconds)
            time.sleep(wait_seconds)
            continue
        try:
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            if attempt == retries:
                raise
            backoff = 2 ** attempt
            logger.warning("GitHub request failed (%s/%s): %s. Retrying in %ss", attempt, retries, exc, backoff)
            time.sleep(backoff)
    raise RuntimeError("Failed to fetch GitHub repo data")


def fetch_github_links(engine: Any) -> Iterable[Tuple[str, str, str]]:
    links_table = Table("Link", metadata, autoload_with=engine)
    stmt = select(links_table.c.id, links_table.c.projectId, links_table.c.url).where(
        links_table.c.type == "github_repo"
    )
    with engine.begin() as connection:
        rows = connection.execute(stmt).fetchall()
    for row in rows:
        yield row.id, row.projectId, row.url


def upsert_metrics(rows: Iterable[Dict[str, Any]]) -> None:
    rows_list = list(rows)
    if not rows_list:
        logger.info("No GitHub metrics to insert")
        return
    engine = get_engine()
    metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(insert(github_metrics).values(rows_list))
    logger.info("Inserted %s GitHub metric rows", len(rows_list))


def run() -> None:
    token = get_github_token()
    engine = get_engine()
    metadata.create_all(engine)

    metrics_rows = []
    for link_id, project_id, url in fetch_github_links(engine):
        repo = parse_repo_from_url(url)
        if not repo:
            logger.warning("Skipping invalid GitHub URL: %s", url)
            continue
        payload = fetch_github_repo(repo, token)
        metrics_rows.append(
            {
                "id": str(uuid.uuid4()),
                "link_id": link_id,
                "project_id": project_id,
                "repo_full_name": payload.get("full_name", repo),
                "stars": payload.get("stargazers_count", 0),
                "forks": payload.get("forks_count", 0),
                "open_issues": payload.get("open_issues_count", 0),
                "watchers": payload.get("subscribers_count", payload.get("watchers_count", 0)),
                "captured_at": datetime.now(timezone.utc),
                "source_url": f"{GITHUB_API_BASE}/repos/{repo}",
                "source_type": "github_api",
                "raw_payload": payload,
            }
        )

    upsert_metrics(metrics_rows)


if __name__ == "__main__":
    run()
