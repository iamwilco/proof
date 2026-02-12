# PROOF System Architecture

> **Public Registry of Outcomes & On-chain Funding**

---

## Overview

PROOF is a transparency platform that tracks Cardano treasury/grant funding (Project Catalyst) and connects **People ↔ Projects ↔ Funds ↔ Deliverables ↔ Outcomes** into a searchable database with community accountability features.

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 14+ (App Router), React, TypeScript | Server Components + Client Components |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Database** | PostgreSQL via Supabase | Prisma ORM |
| **Graph Visualization** | Cytoscape.js | Network graph rendering |
| **ETL Workers** | Python (SQLAlchemy, BeautifulSoup) | Data ingestion pipelines |
| **State Management** | TanStack Query | Server state caching |
| **Authentication** | Supabase Auth + CIP-30 Wallets | Magic link + wallet signatures |

---

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         PROOF                                │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                         │
│  ├── Projects Directory    ├── People Profiles              │
│  ├── Project Detail Page   ├── Impact Rankings              │
│  ├── Network Graph         └── Community Hub                │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Next.js API Routes)                             │
│  ├── Search & Filters      ├── User Auth                    │
│  ├── Ratings & Concerns    └── Admin Moderation             │
├─────────────────────────────────────────────────────────────┤
│  ETL Workers (Python)                                       │
│  ├── Catalyst Ingestion    ├── GitHub Metrics               │
│  ├── YouTube Metrics       └── Graph Analytics (NetworkX)   │
├─────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL / Supabase)                           │
│  ├── Funds, Projects, Milestones, Deliverables              │
│  ├── People, Organizations, Links                           │
│  ├── Users, Ratings, Concerns, Evidence, Responses          │
│  └── Audit Logs, Verifications, Disputes                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Ingestion Pipeline

```
External Sources                    ETL Workers                   Database
┌─────────────────┐                ┌─────────────┐              ┌─────────┐
│ Catalyst API    │───────────────▶│ ingest_     │─────────────▶│ Project │
│ (CatalystExplorer)               │ catalyst.ts │              │ Fund    │
└─────────────────┘                └─────────────┘              │ Person  │
                                                                └─────────┘
┌─────────────────┐                ┌─────────────┐              ┌─────────┐
│ GitHub API      │───────────────▶│ github_     │─────────────▶│ github_ │
│                 │                │ metrics.py  │              │ metrics │
└─────────────────┘                └─────────────┘              └─────────┘

┌─────────────────┐                ┌─────────────┐              ┌─────────┐
│ YouTube API     │───────────────▶│ youtube_    │─────────────▶│ youtube_│
│                 │                │ metrics.py  │              │ metrics │
└─────────────────┘                └─────────────┘              └─────────┘

┌─────────────────┐                ┌─────────────┐              ┌─────────┐
│ projectcatalyst │───────────────▶│ scrape_     │─────────────▶│ scraped_│
│ .io (scraper)   │                │ proposals.py│              │proposals│
└─────────────────┘                └─────────────┘              └─────────┘
```

### User Request Flow

```
User                   Next.js                  Prisma                 PostgreSQL
 │                        │                        │                        │
 │──GET /projects────────▶│                        │                        │
 │                        │──findMany()───────────▶│                        │
 │                        │                        │──SELECT * FROM────────▶│
 │                        │                        │◀─────────rows──────────│
 │                        │◀──────data─────────────│                        │
 │◀─────HTML/JSON─────────│                        │                        │
```

---

## Module Directory

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/components/` | Reusable React components |
| `src/lib/` | Utilities, Prisma client, Supabase client |
| `prisma/` | Database schema and migrations |
| `etl/` | Python ETL workers and metrics fetchers |
| `scripts/` | TypeScript ingestion scripts |

---

## External Integrations

### Catalyst Data Sources

| Source | Type | Endpoint |
|--------|------|----------|
| CatalystExplorer API | REST | `https://www.catalystexplorer.com/api/v1/` |
| Lido Nation API | REST | `https://www.lidonation.com/api/catalyst-explorer/` |
| projectcatalyst.io | Scraper | `https://projectcatalyst.io/` |
| milestones.projectcatalyst.io | Scraper | `https://milestones.projectcatalyst.io/` |

### Jörmungandr (Voting)

| Endpoint | Purpose |
|----------|---------|
| `jcli rest v0 vote active plans get` | Get active vote plans |
| `jcli rest v0 vote active committees get` | Get committee members |

See `etl/catalyst/voting-sources.md` for detailed documentation.

---

## Cardano Integration

### Wallet Authentication (CIP-30)

1. User connects wallet via browser extension
2. Server generates nonce
3. Wallet signs nonce message
4. Server verifies signature matches wallet address
5. Session created in database

### Future: On-Chain Verification

- Transaction verification for funded proposals
- Treasury disbursement tracking
- Multi-sig wallet monitoring

---

## Key Design Decisions

1. **Fact-first** — Every claim must be source-linked
2. **Neutral language** — Metrics speak for themselves
3. **Source provenance** — Every field tracks source_url, source_type, last_seen_at
4. **Immutable audit trail** — Edits tracked, never deleted

---

**Created:** 2026-02-12  
**Last Updated:** 2026-02-12
