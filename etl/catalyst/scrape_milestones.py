"""
Scrape milestones.projectcatalyst.io milestone pages.

Rationale: milestones.projectcatalyst.io does not expose a public API and has no
official data export. Scraping public pages is currently the only viable option.
"""

import json
import logging
import os
import re
import time
import uuid
from datetime import datetime, timezone
from typing import Iterable, List, Optional, Set

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, MetaData, String, Table, Text, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("catalyst.scrape.milestones")

metadata = MetaData()

scraped_milestones = Table(
    "catalyst_scraped_milestones",
    metadata,
    Column("id", String, primary_key=True),
    Column("project_url", String, nullable=False),
    Column("milestone_url", String, nullable=False, unique=True),
    Column("project_slug", String, nullable=True),
    Column("milestone_slug", String, nullable=True),
    Column("title", String(500), nullable=True),
    Column("status", String(100), nullable=True),
    Column("due_date", String(100), nullable=True),
    Column("description", Text, nullable=True),
    Column("raw_html", Text, nullable=True),
    Column("raw_payload", JSONB, nullable=True),
    Column("scraped_at", DateTime(timezone=True), nullable=False),
)

projects = Table(
    "Project",
    metadata,
    Column("id", String, primary_key=True),
    Column("sourceUrl", String),
    Column("externalId", String),
    Column("fundId", String),
    Column("fundingStatus", String),
)

funds = Table(
    "Fund",
    metadata,
    Column("id", String, primary_key=True),
    Column("number", String),
)

milestones = Table(
    "Milestone",
    metadata,
    Column("id", String, primary_key=True),
    Column("projectId", String),
    Column("title", String),
    Column("dueDate", DateTime(timezone=True)),
    Column("status", String),
    Column("sourceUrl", String),
    Column("sourceType", String),
    Column("lastSeenAt", DateTime(timezone=True)),
    Column("createdAt", DateTime(timezone=True)),
    Column("updatedAt", DateTime(timezone=True)),
)

BASE_URL = "https://milestones.projectcatalyst.io"
USER_AGENT = "PROOF-MilestoneScraper/1.0"
MAX_RETRIES = 3
REQUEST_TIMEOUT = 30
RATE_LIMIT_SECONDS = 1.0
_LAST_REQUEST_AT = 0.0


def get_engine():
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")
    return create_engine(database_url)


def normalize_url(url: str) -> str:
    if url.startswith("/"):
        return f"{BASE_URL}{url}"
    return url


def fetch_html(url: str) -> str:
    global _LAST_REQUEST_AT
    attempt = 0
    while True:
        attempt += 1
        try:
            now = time.time()
            wait_for = RATE_LIMIT_SECONDS - (now - _LAST_REQUEST_AT)
            if wait_for > 0:
                time.sleep(wait_for)
            response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            _LAST_REQUEST_AT = time.time()
            return response.text
        except requests.RequestException as exc:
            if attempt >= MAX_RETRIES:
                raise
            wait = 1.5 ** attempt
            logger.warning("Failed to fetch %s (attempt %s/%s): %s. Retrying in %.1fs", url, attempt, MAX_RETRIES, exc, wait)
            time.sleep(wait)


def _extract_pagination_links(soup: BeautifulSoup, base_url: str) -> Set[str]:
    links: Set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if "page=" in href:
            links.add(normalize_url(href))
    links.add(base_url)
    return links


def _extract_project_links(soup: BeautifulSoup) -> Set[str]:
    links: Set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if "/projects/" in href or "/proposals/" in href:
            links.add(normalize_url(href))
    return links


def extract_project_links(index_url: str) -> Set[str]:
    html = fetch_html(index_url)
    soup = BeautifulSoup(html, "html.parser")
    pages = _extract_pagination_links(soup, index_url)
    links = set(_extract_project_links(soup))

    for page_url in sorted(pages):
        if page_url == index_url:
            continue
        page_html = fetch_html(page_url)
        page_soup = BeautifulSoup(page_html, "html.parser")
        links.update(_extract_project_links(page_soup))

    logger.info("Found %s project links", len(links))
    return links


def _find_label_value(soup: BeautifulSoup, label: str) -> Optional[str]:
    pattern = re.compile(label, re.IGNORECASE)
    label_node = soup.find(string=pattern)
    if not label_node:
        return None
    if label_node.parent:
        text = label_node.parent.get_text(" ", strip=True)
        if text:
            return text.replace(label_node.strip(), "").strip(" :-") or text
    return label_node.strip()


def extract_milestone_links(project_url: str) -> Set[str]:
    html = fetch_html(project_url)
    soup = BeautifulSoup(html, "html.parser")
    milestone_links: Set[str] = set()

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if "milestone" in href.lower():
            milestone_links.add(normalize_url(href))

    if not milestone_links:
        milestone_links.add(project_url)

    return milestone_links


def extract_milestone_content(project_url: str, milestone_url: str) -> dict:
    html = fetch_html(milestone_url)
    soup = BeautifulSoup(html, "html.parser")
    title = soup.find("h1")
    title_text = title.get_text(strip=True) if title else None

    status = _find_label_value(soup, "Status")
    due_date = _find_label_value(soup, "Due")
    som_status = _find_label_value(soup, "SoM Status")
    som_submitted = _find_label_value(soup, "SoM Submitted")
    som_approved = _find_label_value(soup, "SoM Approved")
    poa_status = _find_label_value(soup, "PoA Status")
    poa_submitted = _find_label_value(soup, "PoA Submitted")
    poa_approved = _find_label_value(soup, "PoA Approved")
    reviewer_feedback = _find_label_value(soup, "Reviewer Feedback")
    payment_status = _find_label_value(soup, "Payment Status")
    payment_tx_hash = _find_label_value(soup, "Payment Tx")

    main = soup.find("main") or soup.body
    description = main.get_text("\n", strip=True) if main else None
    evidence_urls = [
        anchor["href"]
        for anchor in (main.find_all("a", href=True) if main else [])
        if anchor["href"].startswith("http")
    ]

    return {
        "project_url": project_url,
        "milestone_url": milestone_url,
        "title": title_text,
        "status": status,
        "due_date": due_date,
        "description": description,
        "som_status": som_status,
        "som_submitted_at": som_submitted,
        "som_approved_at": som_approved,
        "poa_status": poa_status,
        "poa_submitted_at": poa_submitted,
        "poa_approved_at": poa_approved,
        "reviewer_feedback": reviewer_feedback,
        "payment_status": payment_status,
        "payment_tx_hash": payment_tx_hash,
        "evidence_urls": evidence_urls,
        "raw_html": html,
    }


def resolve_project_id(connection, project_url: str) -> Optional[str]:
    return connection.execute(
        select(projects.c.id).where(projects.c.sourceUrl == project_url)
    ).scalar_one_or_none()


def resolve_project_external_id(connection, project_url: str) -> Optional[str]:
    return connection.execute(
        select(projects.c.externalId).where(projects.c.sourceUrl == project_url)
    ).scalar_one_or_none()


def upsert_milestone(connection, project_id: Optional[str], payload: dict) -> None:
    if not project_id:
        return

    now = datetime.now(timezone.utc)
    existing_id = connection.execute(
        select(milestones.c.id).where(
            (milestones.c.projectId == project_id)
            & (milestones.c.sourceUrl == payload.get("milestone_url"))
        )
    ).scalar_one_or_none()

    due_date = None
    due_raw = payload.get("due_date") or ""
    date_match = re.search(r"(\d{4}-\d{2}-\d{2})", due_raw)
    if date_match:
        try:
            due_date = datetime.fromisoformat(date_match.group(1)).replace(tzinfo=timezone.utc)
        except ValueError:
            due_date = None

    milestone_data = {
        "projectId": project_id,
        "title": payload.get("title") or "Milestone",
        "dueDate": due_date,
        "status": payload.get("status") or "pending",
        "sourceUrl": payload.get("milestone_url"),
        "sourceType": "catalyst_milestone_scrape",
        "lastSeenAt": now,
        "createdAt": now,
        "updatedAt": now,
    }

    if existing_id:
        milestone_data.pop("createdAt", None)
        milestone_data["updatedAt"] = now
        connection.execute(
            milestones.update().where(milestones.c.id == existing_id).values(**milestone_data)
        )
    else:
        milestone_data["id"] = str(uuid.uuid4())
        connection.execute(milestones.insert().values(**milestone_data))


def persist_payloads(connection, rows: List[dict]) -> None:
    if not rows:
        logger.info("No milestones to persist")
        return
    connection.execute(scraped_milestones.insert().values(rows))
    logger.info("Persisted %s milestones", len(rows))


def scrape_project(project_url: str, connection) -> List[dict]:
    project_url = normalize_url(project_url)
    project_slug = project_url.rstrip("/").split("/")[-1]
    milestone_links = extract_milestone_links(project_url)
    project_external_id = resolve_project_external_id(connection, project_url)

    rows: List[dict] = []
    output_rows: List[dict] = []
    for milestone_url in sorted(milestone_links):
        try:
            payload = extract_milestone_content(project_url, milestone_url)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to scrape %s: %s", milestone_url, exc)
            continue

        rows.append(
            {
                "id": str(uuid.uuid4()),
                "project_url": project_url,
                "milestone_url": milestone_url,
                "project_slug": project_slug,
                "milestone_slug": milestone_url.rstrip("/").split("/")[-1],
                "title": payload.get("title"),
                "status": payload.get("status"),
                "due_date": payload.get("due_date"),
                "description": payload.get("description"),
                "raw_html": payload.get("raw_html"),
                "raw_payload": payload,
                "scraped_at": datetime.now(timezone.utc),
            }
        )

        output_rows.append(
            {
                "project_external_id": project_external_id,
                "title": payload.get("title") or "Milestone",
                "description": payload.get("description"),
                "due_date": payload.get("due_date"),
                "status": payload.get("status"),
                "som_status": payload.get("som_status"),
                "som_submitted_at": payload.get("som_submitted_at"),
                "som_approved_at": payload.get("som_approved_at"),
                "poa_status": payload.get("poa_status"),
                "poa_submitted_at": payload.get("poa_submitted_at"),
                "poa_approved_at": payload.get("poa_approved_at"),
                "reviewer_feedback": payload.get("reviewer_feedback"),
                "payment_status": payload.get("payment_status"),
                "payment_tx_hash": payload.get("payment_tx_hash"),
                "evidence_urls": payload.get("evidence_urls") or [],
                "source_url": payload.get("milestone_url"),
                "source_type": "catalyst_milestone_scrape",
            }
        )

        project_id = resolve_project_id(connection, project_url)
        upsert_milestone(connection, project_id, payload)
        time.sleep(0.05)

    persist_payloads(connection, rows)
    return output_rows


def load_urls_from_file(path: str) -> List[str]:
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if isinstance(data, list):
        return [normalize_url(item) for item in data]
    raise ValueError("Expected a JSON array of URLs")


def load_project_urls_by_fund(connection, fund_number: int, funded_only: bool) -> List[str]:
    query = (
        select(projects.c.sourceUrl)
        .select_from(projects.join(funds, projects.c.fundId == funds.c.id))
        .where(funds.c.number == fund_number)
    )
    if funded_only:
        query = query.where(projects.c.fundingStatus == "funded")

    rows = connection.execute(query).scalars().all()
    return [normalize_url(row) for row in rows if row]


def run(
    index_url: str,
    project_urls: Optional[Iterable[str]] = None,
    output_path: Optional[str] = None,
    fund_number: Optional[int] = None,
    funded_only: bool = True,
) -> None:
    engine = get_engine()
    metadata.create_all(engine)
    output_rows: List[dict] = []
    with engine.begin() as connection:
        links = set(project_urls or [])
        if not links and fund_number is not None:
            links = set(load_project_urls_by_fund(connection, fund_number, funded_only))
        if not links:
            links = set(extract_project_links(index_url))
        for project_url in sorted(links):
            output_rows.extend(scrape_project(project_url, connection))

    if output_path:
        with open(output_path, "w", encoding="utf-8") as handle:
            json.dump(output_rows, handle, indent=2, ensure_ascii=True)
        logger.info("Wrote milestone payload to %s", output_path)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Scrape Catalyst milestone reports")
    parser.add_argument("index_url", help="Index URL (e.g. https://milestones.projectcatalyst.io)")
    parser.add_argument("--project-file", help="JSON file with project URLs")
    parser.add_argument("--output", help="Path to write MilestoneRecord JSON payload")
    parser.add_argument("--fund-number", type=int, help="Fund number to load project URLs from the database")
    parser.add_argument("--include-unfunded", action="store_true", help="Include unfunded projects")
    args = parser.parse_args()

    urls = load_urls_from_file(args.project_file) if args.project_file else None
    run(
        args.index_url,
        urls,
        args.output,
        args.fund_number,
        funded_only=not args.include_unfunded,
    )
