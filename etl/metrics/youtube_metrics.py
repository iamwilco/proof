import logging
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional, Tuple
from urllib.parse import parse_qs, urlparse

import requests
from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Integer, MetaData, String, Table, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB, insert

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("metrics.youtube")

metadata = MetaData()

youtube_metrics = Table(
    "youtube_metrics",
    metadata,
    Column("id", String, primary_key=True),
    Column("link_id", String, nullable=False),
    Column("project_id", String, nullable=False),
    Column("resource_type", String, nullable=False),
    Column("resource_id", String, nullable=False),
    Column("views", Integer, nullable=False),
    Column("likes", Integer, nullable=False),
    Column("comments", Integer, nullable=False),
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


def get_youtube_key() -> str:
    key = os.getenv("YOUTUBE_API_KEY")
    if not key:
        raise RuntimeError("YOUTUBE_API_KEY is required to fetch YouTube metrics")
    return key


def parse_youtube_resource(url: str) -> Optional[Tuple[str, str]]:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    path = parsed.path.strip("/")

    if "youtu.be" in host and path:
        return "video", path.split("/")[0]

    if "youtube.com" not in host and "www.youtube.com" not in host:
        return None

    if path.startswith("watch"):
        query = parse_qs(parsed.query)
        video_id = query.get("v", [""])[0]
        if video_id:
            return "video", video_id

    if path.startswith("shorts/"):
        video_id = path.split("/")[1]
        return "video", video_id

    if path.startswith("channel/"):
        channel_id = path.split("/")[1]
        return "channel", channel_id

    if path.startswith("@"):
        handle = path.lstrip("@")
        if handle:
            return "handle", handle

    return None


def resolve_channel_id(resource: Tuple[str, str], api_key: str) -> Optional[str]:
    resource_type, identifier = resource
    if resource_type == "channel":
        return identifier

    if resource_type == "handle":
        params = {
            "part": "id",
            "forHandle": identifier,
            "key": api_key,
        }
        response = requests.get(f"{YOUTUBE_API_BASE}/channels", params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        items = data.get("items") or []
        if items:
            return items[0]["id"]
        return None

    return None


def fetch_video_stats(video_id: str, api_key: str) -> Dict[str, Any]:
    params = {
        "part": "statistics",
        "id": video_id,
        "key": api_key,
    }
    response = requests.get(f"{YOUTUBE_API_BASE}/videos", params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    items = data.get("items") or []
    if not items:
        raise RuntimeError(f"No video found for {video_id}")
    return items[0]


def fetch_channel_stats(channel_id: str, api_key: str) -> Dict[str, Any]:
    params = {
        "part": "statistics",
        "id": channel_id,
        "key": api_key,
    }
    response = requests.get(f"{YOUTUBE_API_BASE}/channels", params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    items = data.get("items") or []
    if not items:
        raise RuntimeError(f"No channel found for {channel_id}")
    return items[0]


def fetch_youtube_links(engine: Any) -> Iterable[Tuple[str, str, str]]:
    links_table = Table("Link", metadata, autoload_with=engine)
    stmt = select(links_table.c.id, links_table.c.projectId, links_table.c.url).where(
        links_table.c.type == "youtube"
    )
    with engine.begin() as connection:
        rows = connection.execute(stmt).fetchall()
    for row in rows:
        yield row.id, row.projectId, row.url


def upsert_metrics(rows: Iterable[Dict[str, Any]]) -> None:
    rows_list = list(rows)
    if not rows_list:
        logger.info("No YouTube metrics to insert")
        return
    engine = get_engine()
    metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(insert(youtube_metrics).values(rows_list))
    logger.info("Inserted %s YouTube metric rows", len(rows_list))


def run() -> None:
    api_key = get_youtube_key()
    engine = get_engine()
    metadata.create_all(engine)

    metrics_rows = []
    for link_id, project_id, url in fetch_youtube_links(engine):
        resource = parse_youtube_resource(url)
        if not resource:
            logger.warning("Skipping invalid YouTube URL: %s", url)
            continue

        try:
            if resource[0] == "video":
                payload = fetch_video_stats(resource[1], api_key)
                stats = payload.get("statistics", {})
                metrics_rows.append(
                    {
                        "id": str(uuid.uuid4()),
                        "link_id": link_id,
                        "project_id": project_id,
                        "resource_type": "video",
                        "resource_id": resource[1],
                        "views": int(stats.get("viewCount", 0)),
                        "likes": int(stats.get("likeCount", 0)),
                        "comments": int(stats.get("commentCount", 0)),
                        "captured_at": datetime.now(timezone.utc),
                        "source_url": f"{YOUTUBE_API_BASE}/videos?id={resource[1]}",
                        "source_type": "youtube_api",
                        "raw_payload": payload,
                    }
                )
            else:
                channel_id = resolve_channel_id(resource, api_key)
                if not channel_id:
                    logger.warning("Could not resolve channel for %s", url)
                    continue
                payload = fetch_channel_stats(channel_id, api_key)
                stats = payload.get("statistics", {})
                metrics_rows.append(
                    {
                        "id": str(uuid.uuid4()),
                        "link_id": link_id,
                        "project_id": project_id,
                        "resource_type": "channel",
                        "resource_id": channel_id,
                        "views": int(stats.get("viewCount", 0)),
                        "likes": int(stats.get("subscriberCount", 0)),
                        "comments": int(stats.get("videoCount", 0)),
                        "captured_at": datetime.now(timezone.utc),
                        "source_url": f"{YOUTUBE_API_BASE}/channels?id={channel_id}",
                        "source_type": "youtube_api",
                        "raw_payload": payload,
                    }
                )
        except requests.RequestException as exc:
            logger.warning("YouTube API error for %s: %s", url, exc)
            time.sleep(1.5)

    upsert_metrics(metrics_rows)


if __name__ == "__main__":
    run()
