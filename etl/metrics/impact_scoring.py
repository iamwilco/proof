import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Float, MetaData, String, Table, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB, insert

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("metrics.impact")

metadata = MetaData()

impact_scores = Table(
    "impact_scores",
    metadata,
    Column("id", String, primary_key=True),
    Column("project_id", String, nullable=False),
    Column("score", Float, nullable=False),
    Column("confidence", Float, nullable=False),
    Column("captured_at", DateTime(timezone=True), nullable=False),
    Column("source_type", String, nullable=False),
    Column("breakdown", JSONB, nullable=False),
)


@dataclass
class KPIConfig:
    target: float
    weight: float


DEFAULT_KPIS: Dict[str, KPIConfig] = {
    "funding_amount": KPIConfig(target=100_000, weight=0.35),
    "github_stars": KPIConfig(target=500, weight=0.25),
    "github_forks": KPIConfig(target=100, weight=0.15),
    "youtube_views": KPIConfig(target=10_000, weight=0.25),
}

CATEGORY_OVERRIDES: Dict[str, Dict[str, KPIConfig]] = {
    "community": {
        "funding_amount": KPIConfig(target=80_000, weight=0.25),
        "github_stars": KPIConfig(target=300, weight=0.15),
        "github_forks": KPIConfig(target=60, weight=0.1),
        "youtube_views": KPIConfig(target=25_000, weight=0.5),
    },
    "infrastructure": {
        "funding_amount": KPIConfig(target=150_000, weight=0.4),
        "github_stars": KPIConfig(target=800, weight=0.3),
        "github_forks": KPIConfig(target=150, weight=0.2),
        "youtube_views": KPIConfig(target=5_000, weight=0.1),
    },
}


def get_engine() -> Any:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required to run impact scoring")
    return create_engine(database_url)


def normalize(value: Optional[float], target: float) -> float:
    if value is None:
        return 0.0
    return min(value / target, 1.0)


def latest_metrics_by_project(rows: Iterable[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    latest: Dict[str, Dict[str, Any]] = {}
    for row in rows:
        project_id = row["project_id"]
        captured_at = row["captured_at"]
        existing = latest.get(project_id)
        if existing is None or captured_at > existing["captured_at"]:
            latest[project_id] = row
    return latest


def fetch_metrics(engine: Any, table_name: str) -> List[Dict[str, Any]]:
    table = Table(table_name, metadata, autoload_with=engine)
    stmt = select(table)
    with engine.begin() as connection:
        rows = connection.execute(stmt).mappings().all()
    return [dict(row) for row in rows]


def fetch_projects(engine: Any) -> List[Dict[str, Any]]:
    project_table = Table("Project", metadata, autoload_with=engine)
    stmt = select(project_table.c.id, project_table.c.category, project_table.c.fundingAmount)
    with engine.begin() as connection:
        rows = connection.execute(stmt).mappings().all()
    return [dict(row) for row in rows]


def build_kpis(category: Optional[str]) -> Dict[str, KPIConfig]:
    key = (category or "").lower()
    overrides = CATEGORY_OVERRIDES.get(key)
    if not overrides:
        return DEFAULT_KPIS
    return overrides


def calculate_score(
    project: Dict[str, Any],
    github: Optional[Dict[str, Any]],
    youtube: Optional[Dict[str, Any]],
) -> Tuple[float, float, Dict[str, Any]]:
    kpis = build_kpis(project.get("category"))

    values: Dict[str, Optional[float]] = {
        "funding_amount": float(project.get("fundingAmount") or 0),
        "github_stars": float(github.get("stars", 0)) if github else None,
        "github_forks": float(github.get("forks", 0)) if github else None,
        "youtube_views": float(youtube.get("views", 0)) if youtube else None,
    }

    total_weight = 0.0
    weighted_score = 0.0
    available = 0

    breakdown: Dict[str, Any] = {"values": values, "weights": {}, "normalized": {}}

    for key, config in kpis.items():
        normalized = normalize(values.get(key), config.target)
        breakdown["weights"][key] = config.weight
        breakdown["normalized"][key] = normalized
        total_weight += config.weight
        weighted_score += normalized * config.weight
        if values.get(key) is not None:
            available += 1

    score = 100 * (weighted_score / total_weight if total_weight else 0)
    confidence = available / len(kpis) if kpis else 0
    breakdown["score"] = score
    breakdown["confidence"] = confidence

    return score, confidence, breakdown


def upsert_scores(rows: List[Dict[str, Any]]) -> None:
    if not rows:
        logger.info("No impact scores to insert")
        return
    engine = get_engine()
    metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(insert(impact_scores).values(rows))
    logger.info("Inserted %s impact score rows", len(rows))


def run() -> None:
    engine = get_engine()
    metadata.create_all(engine)

    github_metrics = latest_metrics_by_project(fetch_metrics(engine, "github_repo_metrics"))
    youtube_metrics = latest_metrics_by_project(fetch_metrics(engine, "youtube_metrics"))
    projects = fetch_projects(engine)

    now = datetime.now(timezone.utc)
    rows: List[Dict[str, Any]] = []

    for project in projects:
        project_id = project["id"]
        score, confidence, breakdown = calculate_score(
            project,
            github_metrics.get(project_id),
            youtube_metrics.get(project_id),
        )
        rows.append(
            {
                "id": f"impact_{project_id}_{int(now.timestamp())}",
                "project_id": project_id,
                "score": score,
                "confidence": confidence,
                "captured_at": now,
                "source_type": "impact_scoring_v1",
                "breakdown": breakdown,
            }
        )

    upsert_scores(rows)


if __name__ == "__main__":
    run()
