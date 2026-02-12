# PROOF Setup Checklist

Use this checklist to run the system locally and start ingesting data.

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment variables

Create `.env` in the project root:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_TOKEN=your_admin_token
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MONITORING_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook
GITHUB_TOKEN=ghp_your_token_here
YOUTUBE_API_KEY=your_api_key_here
```

Notes:
- `NEXT_PUBLIC_SITE_URL` is required for OG images and admin health checks.
- `ADMIN_TOKEN` is required for `/admin/health` access via the `x-admin-token` header.

## 3) Initialize the database

```bash
npx prisma generate
npx prisma migrate dev
```

## 4) Run the app

```bash
npm run dev
```

Visit: http://localhost:3000

## 5) ETL setup (Python)

```bash
cd etl
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `etl/.env` with:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
GITHUB_TOKEN=ghp_your_token_here
YOUTUBE_API_KEY=your_api_key_here
MONITORING_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook
```

## 6) Ingest Catalyst proposals

Fetch proposals from CatalystExplorer API:

```bash
# Full ingestion (~11,000 proposals, takes ~30 minutes)
npm run ingest:proposals

# Limited ingestion for testing (5 pages = 300 proposals)
INGEST_MAX_PAGES=5 npm run ingest:proposals
```

## 7) Run metrics pipelines (optional)

```bash
python etl/metrics/github_metrics.py
python etl/metrics/youtube_metrics.py
python etl/metrics/impact_scoring.py
```

## 8) Health checks

- `/api/health` for uptime + DB latency
- `/admin/health` (requires `x-admin-token` header)

## 9) Manual data entry (optional)

You can also browse/edit data via Prisma Studio:

```bash
npx prisma studio
```

