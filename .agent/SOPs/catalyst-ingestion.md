# SOP: Catalyst Data Ingestion

## Overview
Step-by-step procedure for ingesting Catalyst proposal, voting, and metrics data into the PROOF database.

## Prerequisites
- PostgreSQL database running (via Supabase)
- `DATABASE_URL` environment variable set
- Python virtual environment configured in `etl/`

## Step-by-Step Procedure

### Step 1: Set Up ETL Environment

```bash
cd etl
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Run Proposal Ingestion (TypeScript)

For full proposal ingestion with team members:

```bash
npx tsx scripts/ingest-catalyst.ts
```

Environment variables:
- `INGEST_MAX_PAGES` — Limit pages for testing (default: all)

### Step 3: Run Scraped Proposal Ingestion (Python)

For proposals scraped from projectcatalyst.io:

```bash
cd etl
python catalyst/ingest_scraped_proposals.py
```

### Step 4: Run Voting Data Ingestion

```bash
cd etl
python catalyst/ingest_voting_records.py
```

This will:
- Fetch yes/no vote counts from Catalyst Explorer API
- Calculate approval rates and funding probability
- Assign fund and category rankings

### Step 5: Run Metrics Ingestion

GitHub metrics:
```bash
python metrics/github_metrics.py
```

YouTube metrics:
```bash
python metrics/youtube_metrics.py
```

Impact scores:
```bash
python metrics/impact_scoring.py
```

## Common Pitfalls

### ⚠️ Rate Limiting
**Problem:** API returns 429 errors after many requests  
**Solution:** The scripts include retry logic with exponential backoff. If persistent, increase `RATE_LIMIT_MS` in the script.

### ⚠️ Missing Fund References
**Problem:** Proposals reference funds that don't exist in database  
**Solution:** Run proposal ingestion first to ensure funds are created. The scripts auto-create missing funds.

### ⚠️ Database Connection Timeout
**Problem:** Long-running ingestion times out  
**Solution:** Check Supabase connection pooling settings. Consider running in batches.

## Verification

Check ingestion results:

```sql
-- Count proposals by fund
SELECT f.name, COUNT(p.id) 
FROM "Project" p 
JOIN "Fund" f ON p."fundId" = f.id 
GROUP BY f.name;

-- Check voting records
SELECT COUNT(*) FROM "VotingRecord";

-- Check people count
SELECT COUNT(*) FROM "Person";
```

## References
- `etl/catalyst/api.md` — Catalyst Explorer API documentation
- `etl/catalyst/voting-sources.md` — Voting data source documentation
- `scripts/ingest-catalyst.ts` — Main ingestion script
- `etl/catalyst/ingest_voting_records.py` — Voting ingestion script

---

**Created:** 2026-02-12  
**Last Updated:** 2026-02-12  
**Author:** Agent
