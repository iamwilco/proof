# PROOF — Product Requirements Document

> **Public Registry of Outcomes & On-chain Funding** (aka "DOGE View")

---

## Objective

Build a public intelligence platform that tracks Cardano treasury/grant funding (starting with Project Catalyst) and connects **People ↔ Projects ↔ Funds ↔ Deliverables ↔ Outcomes** into a searchable database, rankings, and an interactive network graph — with a community layer for accountability.

**Primary value:** Make funding outcomes legible, comparable, and socially accountable.

---

## Invariants

These rules must **never** be broken:

1. **Fact-first** — Every claim must be source-linked or explicitly marked as community opinion
2. **Neutral language** — Use "low observed activity" not accusations; metrics speak for themselves
3. **Source provenance** — Every data field must track `source_url`, `source_type`, `last_seen_at`
4. **No doxxing** — Only public data; no scraping private information
5. **Confidence transparency** — All scores must display confidence levels and methodology
6. **Immutable audit trail** — All moderation actions logged; edits tracked, never deleted

---

## Non-Goals

These are explicitly **out of scope** for MVP:

- **Mobile application** — Web only for v1
- **Non-Catalyst grants** — Intersect/CF/IOG/Emurgo ingestion (design for it, implement later)
- **Full ROI automation** — Start with best-effort + confidence scoring, not perfect automation
- **Perfect identity resolution** — Provide confidence levels and dispute workflows instead
- **Real-time updates** — Daily ETL is sufficient for MVP

---

## Constraints

### Technical Constraints

- **Frontend:** Next.js 14+ (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Supabase
- **Graph visualization:** Cytoscape.js
- **ETL:** Python for data ingestion and network analytics
- **State management:** TanStack Query

### Process Constraints

- **One task per agent session** — No batching
- **All changes require passing workflows** — Lint, test, build
- **Documentation updated with code** — If code changes, docs change
- **Small, reversible changes only** — Each commit should be safe to revert

---

## Architecture Overview

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

## Milestones

### Milestone 1: Data Foundation
- PostgreSQL schema design
- Catalyst data ingestion pipeline
- Identity resolution with confidence scoring
- Source provenance tracking

### Milestone 2: Core Product UI
- Projects directory with search/filters
- Project detail pages
- People/team profiles
- Basic rankings

### Milestone 3: Impact + Graph
- GitHub/YouTube metrics fetchers
- Impact scoring engine with category KPIs
- Network graph visualization

### Milestone 4: Community Layer
- User authentication (magic link)
- Ratings, concerns, evidence submission
- Project leader responses
- Reputation system

### Milestone 5: Launch Hardening
- Rate limiting and anti-abuse
- Performance optimization
- Shareable cards (DOGE View)
- Monitoring and alerting

### Milestone 6: Data Accessibility + Acquisition
- Public-facing homepage + setup checklist
- Catalyst proposal scraper (projectcatalyst.io)
- Scraped proposal ingestion into core schema
- Milestone scraping from milestones.projectcatalyst.io

---

## Status

### Current Phase

**Milestone 6: Data Accessibility + Acquisition**

### Current Task

See `tasks/tasks.json` for the current execution queue.

### Completed Tasks

| Task ID | Description | Completed |
|---------|-------------|-----------|
| PROOF-001 | Initialize Next.js project with App Router | 2026-02-10 |
| PROOF-002 | Set up Supabase and Prisma | 2026-02-10 |
| PROOF-003 | Design core database schema | 2026-02-10 |
| PROOF-004 | Create Python ETL project structure | 2026-02-10 |
| PROOF-005 | Research and document Catalyst API | 2026-02-10 |
| PROOF-008 | Implement identity resolution | 2026-02-10 |
| PROOF-009 | Extract and normalize external links | 2026-02-10 |
| PROOF-010 | Build basic admin data health view | 2026-02-10 |
| PROOF-011 | Build projects directory page with search | 2026-02-11 |
| PROOF-012 | Build project detail page | 2026-02-11 |
| PROOF-013 | Build people/team profiles page | 2026-02-11 |
| PROOF-014 | Build basic rankings page | 2026-02-11 |
| PROOF-015 | Install and configure TanStack Query | 2026-02-11 |
| PROOF-016 | Build GitHub metrics fetcher | 2026-02-11 |
| PROOF-017 | Build YouTube metrics fetcher | 2026-02-11 |
| PROOF-018 | Design and implement impact scoring engine | 2026-02-11 |
| PROOF-019 | Build network graph visualization | 2026-02-11 |
| PROOF-020 | Implement magic link authentication | 2026-02-11 |
| PROOF-021 | Build ratings and concerns submission | 2026-02-11 |
| PROOF-022 | Build project leader response system | 2026-02-11 |
| PROOF-023 | Implement reputation system | 2026-02-11 |
| PROOF-024 | Implement rate limiting and anti-abuse | 2026-02-11 |
| PROOF-025 | Performance optimization pass | 2026-02-11 |
| PROOF-026 | Build shareable DOGE View cards | 2026-02-11 |
| PROOF-027 | Set up monitoring and alerting | 2026-02-11 |
| PROOF-028 | Ship real homepage + setup checklist | 2026-02-11 |

### Blocked Tasks

| Task ID | Description | Reason |
|---------|-------------|--------|
| PROOF-006 | Build Catalyst proposal ingestion | API returning 500 errors |
| PROOF-007 | Build milestone/deliverable ingestion | Missing API endpoints |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-02-10 | Initial PRD created from ideation | Agent |
| 2026-02-11 | Updated status with M1 completed/blocked tasks | Agent |
| 2026-02-11 | PROOF-011 completed, started Milestone 2 | Agent |
| 2026-02-11 | PROOF-012 completed (project detail page) | Agent |
| 2026-02-11 | PROOF-013 completed (people/team profiles) | Agent |
| 2026-02-11 | PROOF-014 completed (rankings page) | Agent |
| 2026-02-11 | PROOF-015 completed (TanStack Query setup) | Agent |
| 2026-02-11 | PROOF-016 completed (GitHub metrics fetcher) | Agent |
| 2026-02-11 | PROOF-017 completed (YouTube metrics fetcher) | Agent |
| 2026-02-11 | PROOF-018 completed (impact scoring engine) | Agent |
| 2026-02-11 | PROOF-019 completed (network graph visualization) | Agent |
| 2026-02-11 | PROOF-020 completed (magic link authentication) | Agent |
| 2026-02-11 | PROOF-021 completed (ratings and concerns submission) | Agent |
| 2026-02-11 | PROOF-022 completed (project leader responses) | Agent |
| 2026-02-11 | PROOF-023 completed (reputation system) | Agent |
| 2026-02-11 | PROOF-024 completed (rate limiting and anti-abuse) | Agent |
| 2026-02-11 | PROOF-025 completed (performance optimization pass) | Agent |
| 2026-02-11 | PROOF-026 completed (shareable DOGE View cards) | Agent |
| 2026-02-11 | PROOF-027 completed (monitoring and alerting) | Agent |
| 2026-02-11 | PROOF-028 completed (homepage + setup checklist) | Agent |
| 2026-02-11 | Added Milestone 6 for accessibility + scraping, updated current phase | Agent |