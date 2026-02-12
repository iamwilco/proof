# PROOF ETL

This folder contains data ingestion and analytics pipelines.

## Structure

```
etl/
├── catalyst/   # Catalyst data ingestion
├── metrics/    # GitHub/YouTube KPI fetchers
├── graph/      # Network analytics (NetworkX)
└── requirements.txt
```

## Environment Variables

Create `etl/.env` with:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
GITHUB_TOKEN=ghp_your_token_here
YOUTUBE_API_KEY=your_api_key_here
MONITORING_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook
```

## Setup

```bash
cd etl
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Metrics

### GitHub

Fetches repo metrics for links with type `github_repo`.

```bash
python etl/metrics/github_metrics.py
```

### YouTube

Fetches video/channel metrics for links with type `youtube`.

```bash
python etl/metrics/youtube_metrics.py
```

### Impact Scoring

Calculates impact scores using project funding plus GitHub/YouTube metrics.

```bash
python etl/metrics/impact_scoring.py
```

## Monitoring

The app exposes alert endpoints for ETL failures and error reporting:

- `POST /api/monitoring/etl` with `{ "job": "github_metrics", "status": "error", "message": "..." }`
- `POST /api/monitoring/error` with `{ "source": "etl", "message": "..." }`

Configure `MONITORING_WEBHOOK_URL` to forward alerts to Slack or another webhook.
