import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from typing import Iterable, List, Optional, Set

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, MetaData, String, Table, Text, create_engine
from sqlalchemy.dialects.postgresql import JSONB

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("catalyst.scrape.proposals")

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

BASE_URL = "https://projectcatalyst.io"
USER_AGENT = "PROOF-Scraper/1.0"
MAX_RETRIES = 3
REQUEST_TIMEOUT = 30


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
    attempt = 0
    while True:
        attempt += 1
        try:
            response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response.text
        except requests.RequestException as exc:
            if attempt >= MAX_RETRIES:
                raise
            wait = 1.5 ** attempt
            logger.warning("Failed to fetch %s (attempt %s/%s): %s. Retrying in %.1fs", url, attempt, MAX_RETRIES, exc, wait)
            time.sleep(wait)


def extract_fund_slug(url: str) -> Optional[str]:
    match = re.search(r"/funds/(\d+)", url)
    return match.group(1) if match else None


def _extract_pagination_links(soup: BeautifulSoup, fund_url: str) -> Set[str]:
    pagination_links: Set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if "page=" in href and "/funds/" in href:
            pagination_links.add(normalize_url(href))
    pagination_links.add(fund_url)
    return pagination_links


def _extract_proposal_links_from_soup(soup: BeautifulSoup) -> Set[str]:
    links: Set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if "/funds/" in href and "cardano-open-ecosystem" in href:
            links.add(normalize_url(href))
        elif "/funds/" in href and href.count("/") >= 4:
            links.add(normalize_url(href))
    return links


def extract_proposal_links(fund_url: str) -> Set[str]:
    html = fetch_html(fund_url)
    soup = BeautifulSoup(html, "html.parser")
    page_urls = _extract_pagination_links(soup, fund_url)
    links: Set[str] = set(_extract_proposal_links_from_soup(soup))

    for page_url in sorted(page_urls):
        if page_url == fund_url:
            continue
        page_html = fetch_html(page_url)
        page_soup = BeautifulSoup(page_html, "html.parser")
        links.update(_extract_proposal_links_from_soup(page_soup))

    logger.info("Found %s proposal links", len(links))
    return links


def extract_proposal_content(proposal_url: str) -> dict:
    html = fetch_html(proposal_url)
    soup = BeautifulSoup(html, "html.parser")
    title = soup.find("h1")
    title_text = title.get_text(strip=True) if title else None

    read_more = soup.find(string=re.compile("Read more", re.IGNORECASE))
    if read_more and read_more.parent:
        read_more.parent.decompose()

    main = soup.find("main") or soup.body
    body_text = main.get_text("\n", strip=True) if main else None

    summary = None
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and meta_desc.get("content"):
        summary = meta_desc["content"]

    return {
        "title": title_text,
        "summary": summary,
        "body": body_text,
        "raw_html": html,
    }


def persist_payloads(rows: List[dict]) -> None:
    if not rows:
        logger.info("No proposals to persist")
        return
    engine = get_engine()
    metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(scraped_proposals.insert().values(rows))
    logger.info("Persisted %s proposals", len(rows))


def scrape_fund(fund_url: str, proposal_urls: Optional[Iterable[str]] = None) -> None:
    fund_url = normalize_url(fund_url)
    fund_slug = extract_fund_slug(fund_url)
    links = set(proposal_urls or []) or extract_proposal_links(fund_url)
    rows = []
    for link in sorted(links):
        try:
            payload = extract_proposal_content(link)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to scrape %s: %s", link, exc)
            continue
        rows.append(
            {
                "id": os.urandom(16).hex(),
                "fund_url": fund_url,
                "proposal_url": link,
                "fund_slug": fund_slug,
                "proposal_slug": link.rstrip("/").split("/")[-1],
                "title": payload.get("title"),
                "summary": payload.get("summary"),
                "body": payload.get("body"),
                "raw_html": payload.get("raw_html"),
                "raw_payload": payload,
                "scraped_at": datetime.now(timezone.utc),
            }
        )
        time.sleep(0.5)
    persist_payloads(rows)


def load_urls_from_file(path: str) -> List[str]:
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if isinstance(data, list):
        return [normalize_url(item) for item in data]
    raise ValueError("Expected a JSON array of URLs")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Scrape Catalyst proposals")
    parser.add_argument("fund_url", help="Fund URL (e.g. https://projectcatalyst.io/funds/15)")
    parser.add_argument("--proposal-file", help="JSON file with proposal URLs")
    args = parser.parse_args()

    urls = load_urls_from_file(args.proposal_file) if args.proposal_file else None
    scrape_fund(args.fund_url, urls)
