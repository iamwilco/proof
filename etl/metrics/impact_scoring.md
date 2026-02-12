# Impact Scoring Methodology

## Overview

The impact score is a 0–100 composite derived from category-specific KPIs. Each KPI is normalized to a 0–1 range using a target threshold, then weighted and summed. Scores are recalculated whenever the pipeline runs.

## KPI Definitions

Baseline KPIs:

- **funding_amount**: total funding amount for the project.
- **github_stars**: latest GitHub stars across linked repos.
- **github_forks**: latest GitHub forks across linked repos.
- **youtube_views**: latest YouTube views for linked videos/channels.

## Category Overrides

Some categories adjust targets and weights to reflect different impact profiles:

- **community**: higher weight on YouTube reach.
- **infrastructure**: higher weight on GitHub traction.

Override values are defined in `impact_scoring.py` under `CATEGORY_OVERRIDES`.

## Scoring Formula

For each KPI:

```
normalized = min(value / target, 1.0)
weighted = normalized * weight
```

Total score:

```
score = 100 * sum(weighted) / sum(weights)
```

## Confidence

Confidence reflects data coverage and is computed as:

```
confidence = available_kpis / total_kpis
```

A KPI is considered available when its input value is present. This allows missing data to reduce confidence without collapsing the score to zero.

## Output

Scores are stored in the `impact_scores` table with:

- `project_id`
- `score`
- `confidence`
- `captured_at`
- `breakdown` (raw values, normalized values, weights)
