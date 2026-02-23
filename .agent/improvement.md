# PROOF Platform — Improvement Plan (BEACNpool/Treasury Integration)

> **Date:** 2026-02-23
> **Source:** Deep research of [BEACNpool/Treasury](https://github.com/BEACNpool/Treasury) + XAi cross-analysis
> **Scope:** Project Catalyst funding transparency only — not general treasury or governance spending

---

## Executive Summary

BEACNpool/Treasury is an open-source audit toolkit that tracks Cardano treasury flows (epoch-level balances, fee revenue, reserves, withdrawals) and publishes a rich off-chain scrape of all Project Catalyst proposers with funding data in both USD and ADA. While their focus is macro treasury analysis, several of their datapoints, scripts, and methodologies can directly improve PROOF's Catalyst transparency mission.

**Key takeaway:** We don't need their treasury depletion dashboards (out of scope), but we *do* need their richer Catalyst proposer data, their validation methodology, and their per-fund spending context to make our proposal-level transparency more complete.

---

## Gap Analysis: What BEACNpool Has That We're Missing

### A. Richer Catalyst Proposer Data (HIGH VALUE)

Their scraper (`catalyst_scrape_proposers.py`) captures 5,500+ proposers from `projectcatalyst.io/api/search?type=proposers` with fields we lack:

| Field | Our Status | Impact |
|-------|-----------|--------|
| `totalDistributed` in **ADA** (not just USD) | Missing — we only track USD amounts | High: F12+ grants are ADA-denominated |
| `totalRemaining` per proposer (USD + ADA) | Missing at proposer level | Medium: shows delivery risk |
| Per-project `country` / `continent` | Missing | Medium: geographic distribution |
| Per-project `tags[]` | Missing | Medium: better categorization |
| Per-project `horizonGroup` | Missing | Low: Catalyst-specific grouping |
| Proposer `avatarUrl` | Have `heroImgUrl` but often empty | Medium: UX polish |
| Proposer `ideascaleUrl` | Missing on Person model | Low: external link |
| Per-project `leftoverVoting` data | Missing | Low: edge case voting info |

**Why this matters:** Starting Fund 12, Catalyst shifted from USD to ADA-denominated grants. Our USD-only tracking understates recent fund sizes and distributions significantly. Their yearly distributions show:
- 2024: $17.5M USD + **₳68M ADA**
- 2025: $18.8M USD + **₳178M ADA**
- 2026: $0 USD + **₳64M ADA** (partial year)

### B. Catalyst Spending Context (MEDIUM VALUE)

Their data provides per-fund context that enriches our proposal-level view:

| Datapoint | Value to PROOF |
|-----------|---------------|
| Yearly Catalyst distributions (USD + ADA) | Show spending trends on Fund pages |
| Top recipients ranking (by total distributed) | Concentration analysis for proposer profiles |
| Completion rates by proposer | Cross-validate our accountability scores |
| Fee revenue vs Catalyst spending ratio | Context on each fund's page ("This fund spent X while the network earned Y in fees") |

### C. Data Validation & Integrity (HIGH VALUE)

Their validation approach can directly improve our data quality:

| Technique | Application to PROOF |
|-----------|---------------------|
| Cross-source verification (db-sync vs API) | Verify our ingested fund totals against on-chain data |
| Reconciliation checks with tolerances | Flag mismatches in `amountReceived` vs actual on-chain payouts |
| SHA256 manifests for scraped data | Prove our data hasn't been tampered with |
| `source_kind` labeling | Track provenance of every datapoint |

### D. Treasury Balance Context (LOW PRIORITY — scope-limited)

While their epoch-level treasury flow data is impressive, full treasury accounting is outside PROOF's scope. However, a **lightweight treasury health indicator** on fund pages would provide useful context for voters evaluating proposals.

### E. Deliverable Type Classification (MEDIUM VALUE — from their AI audit)

Their "AI price-collapse audit" categorizes deliverable types:
`social_media_marketing`, `video_audio`, `translation`, `content_education`, `basic_web_dashboard`, `scraping_data_etl`, `bots_automation`, `legal_admin`

This taxonomy could power:
- Better proposal categorization in our discover/search
- "Deliverable type" badges on proposal cards
- Per-fund breakdown of what types of work got funded

---

## What We Already Have That They Don't

| PROOF Advantage | Description |
|-----------------|-------------|
| Rich milestone tracking | SoM/PoA, reviewer feedback, payment status per milestone |
| GitHub metrics | Stars, forks, commits, PR merge rate, activity scores |
| On-chain project metrics | Per-project tx counts, unique addresses, activity |
| Community engagement | User reviews, ratings, concerns, bookmarks |
| Accountability scores | Weighted composite scores per person/org with badges |
| Wallet verification | Cryptographic linking of wallets to people/orgs |
| Funding transaction tracking | Per-project tx with block/epoch/slot |
| ROI scoring engine | Multi-factor ROI per project |
| Admin tools | Flags, connections, moderation workflows |
| Discover UX | Tinder-style swipe cards for proposal discovery |

---

## Implementation Task List

### Phase 1: Catalyst Proposer Data Enrichment
*Enrich Person and Project models with BEACNpool's richer scrape data.*

| ID | Task | Priority | Effort | Dependencies |
|----|------|----------|--------|--------------|
| IMP-001 | **Add ADA-denominated funding fields to schema** — Add `totalAmountRequestedADA`, `totalAmountAwardedADA`, `totalAmountReceivedADA`, `totalAmountRemainingADA` to Person model. Add `fundingAmountADA`, `amountReceivedADA`, `amountRemainingADA` to Project model. | High | 2h | — |
| IMP-002 | **Add geographic and tag fields to Project** — Add `country`, `continent`, `tags` (String[]), `horizonGroup` fields to Project model. | High | 1h | — |
| IMP-003 | **Port BEACNpool's Catalyst scraper** — Adapt `catalyst_scrape_proposers.py` into `etl/catalyst/scrape_proposers_beacn.py`. Use their API endpoint (`projectcatalyst.io/api/search?type=proposers`) and money-object parser. | High | 4h | — |
| IMP-004 | **Build proposer data reconciliation script** — Match scraped proposers to our Person records by `externalId`/`username`/`name`. Backfill ADA amounts, avatarUrl, ideascaleUrl. Log mismatches. | High | 3h | IMP-001, IMP-003 |
| IMP-005 | **Build project enrichment script** — Match scraped projects to our Project records. Populate country, continent, tags, horizonGroup, ADA amounts. | High | 3h | IMP-002, IMP-003 |
| IMP-006 | **Update Fund model with ADA totals** — Add `totalBudgetADA`, `totalAwardedADA`, `totalDistributedADA` to Fund. Compute from enriched project data. | Medium | 2h | IMP-005 |
| IMP-007 | **Surface ADA amounts in UI** — Update proposal cards, detail pages, and fund overview to show both USD and ADA where available. Smart display: show primary currency based on fund number (USD for F1-F11, ADA for F12+). | Medium | 3h | IMP-001, IMP-006 |

### Phase 2: Data Validation & Integrity
*Adopt BEACNpool's validation rigor for our ingested data.*

| ID | Task | Priority | Effort | Dependencies |
|----|------|----------|--------|--------------|
| IMP-008 | **Build fund totals validation script** — Compare our per-fund totals (budget, awarded, distributed) against BEACNpool's published CSVs and the Catalyst API. Flag discrepancies > 1%. | High | 3h | IMP-006 |
| IMP-009 | **Add on-chain payout verification** — Adapt BEACNpool's `treasury_snapshot.py` (Blockfrost) to verify that `amountReceived` for funded projects matches actual on-chain disbursements. | High | 4h | — |
| IMP-010 | **Add data provenance tracking** — Add `sourceKind` enum (catalyst_api, catalyst_scrape, milestone_api, blockfrost, manual) and `dataHash` to key models. Record provenance on every ETL run. | Medium | 2h | — |
| IMP-011 | **Build health check API** — `GET /api/health/data` returns validation pass/fail, last sync timestamps, record counts, and any flagged mismatches. Surface on admin dashboard. | Medium | 3h | IMP-008 |
| IMP-012 | **Add SHA256 manifests for ETL outputs** — Generate checksums for scraped data files. Store in `etl/manifests/`. Verify on re-import. | Low | 1h | — |

### Phase 3: Catalyst Spending Context
*Add macro spending context to fund pages and proposer profiles.*

| ID | Task | Priority | Effort | Dependencies |
|----|------|----------|--------|--------------|
| IMP-013 | **Import yearly Catalyst distributions** — Create `CatalystYearlyDistribution` model (year, projects, distributed_usd, distributed_ada). Import from BEACNpool's `yearly_distributions.csv` or compute from our data. | Medium | 2h | IMP-005 |
| IMP-014 | **Build top recipients leaderboard** — New `/rankings/recipients` page showing top proposers by total distributed (USD + ADA). Include completion rate, funded/total ratio, active projects count. | Medium | 4h | IMP-004 |
| IMP-015 | **Add concentration analysis** — On fund pages, show: top 10 recipients as % of total fund, Gini coefficient of funding distribution, repeat-funded proposers across funds. | Medium | 3h | IMP-014 |
| IMP-016 | **Add fund spending context widget** — On each fund page, show: total budget, amount distributed, fee revenue during fund period (from BEACNpool data), and spend-to-fee ratio. Lightweight treasury context without full treasury dashboards. | Low | 3h | IMP-013 |

### Phase 4: DuckDB Analytics Layer
*Adopt BEACNpool's DuckDB approach for fast local analytics.*

| ID | Task | Priority | Effort | Dependencies |
|----|------|----------|--------|--------------|
| IMP-017 | **Set up DuckDB indexing for ETL** — Port BEACNpool's `index_duckdb.py` pattern. Index our exported CSVs (proposals, people, funding transactions) into a local DuckDB for fast ad-hoc analytics. | Medium | 5h | — |
| IMP-018 | **Use DuckDB for percentile calculations** — Replace slow Prisma queries in ROI scoring and rankings with DuckDB percentile queries. Target: <1s for any aggregate query. | Medium | 3h | IMP-017 |

### Phase 5: Deliverable Classification
*Add proposal categorization by deliverable type.*

| ID | Task | Priority | Effort | Dependencies |
|----|------|----------|--------|--------------|
| IMP-019 | **Add deliverable type taxonomy** — Add `deliverableType` enum to Project: `software_dapp`, `infrastructure`, `tooling`, `social_media`, `video_audio`, `translation`, `content_education`, `dashboard`, `data_etl`, `automation`, `community_events`, `research`, `governance`, `other`. | Medium | 1h | — |
| IMP-020 | **Auto-classify proposals by deliverable type** — Rule-based classifier using title/description/category keywords. Run as ETL step. Manual override via admin UI. | Medium | 4h | IMP-019 |
| IMP-021 | **Surface deliverable type in UI** — Add type badge to proposal cards and detail pages. Add type filter to discover and search. Per-fund breakdown chart of deliverable types. | Low | 3h | IMP-020 |

### Phase 6: Enhanced Proposer Profiles
*Make proposer profiles richer with cross-fund insights.*

| ID | Task | Priority | Effort | Dependencies |
|----|------|----------|--------|--------------|
| IMP-022 | **Cross-fund proposer history** — On person profile pages, show timeline of proposals across all funds with outcomes. Highlight repeat funding patterns. | Medium | 3h | IMP-004 |
| IMP-023 | **Geographic distribution page** — New `/analytics/geography` showing funded proposals by country/continent per fund. Map visualization. | Low | 4h | IMP-005 |
| IMP-024 | **Proposer risk signals** — Derived from BEACNpool's flag methodology: high concentration, low completion rate, large remaining balances. Surface as "signals" (not accusations) on proposer profiles. | Low | 3h | IMP-004, IMP-015 |

---

## Priority Summary

| Priority | Tasks | Est. Total Effort |
|----------|-------|-------------------|
| **High** | IMP-001 through IMP-009 | ~22 hours |
| **Medium** | IMP-010 through IMP-022 | ~37 hours |
| **Low** | IMP-012, IMP-016, IMP-021, IMP-023, IMP-024 | ~14 hours |

**Recommended execution order:**
1. IMP-001 + IMP-002 (schema changes — do together in one migration)
2. IMP-003 (port scraper)
3. IMP-004 + IMP-005 (enrichment scripts)
4. IMP-007 (surface ADA amounts in UI)
5. IMP-008 + IMP-009 (validation)
6. IMP-014 (top recipients leaderboard)
7. Everything else by priority

---

## Reference: BEACNpool/Treasury Repository Structure

```
BEACNpool/Treasury/
├── docs/
│   ├── index.html                    # "The Reckoning" narrative dashboard
│   ├── methodology.md                # Data provenance, reconciliation
│   ├── data_dictionary.md            # Column definitions for CSVs
│   ├── sources.md                    # Primary/secondary data sources
│   ├── offchain_catalyst.md          # Catalyst scrape documentation
│   └── outputs/
│       ├── epoch_treasury_fees.csv   # Per-epoch treasury flows
│       ├── year_treasury_fees.csv    # Yearly aggregates
│       └── offchain/catalyst/
│           ├── catalyst_proposers_full.json.gz  # Full scrape (5,500+ proposers)
│           ├── top_recipients.csv    # Top funded proposers
│           ├── yearly_distributions.csv  # Yearly spending
│           └── summary.json          # Quick stats
├── scripts/
│   ├── catalyst_scrape_proposers.py  # Catalyst API scraper
│   ├── validate.py                   # Reconciliation checks
│   ├── index_duckdb.py              # DuckDB local analytics
│   ├── dbsync/
│   │   ├── treasury_fees.sql        # Epoch-level treasury SQL
│   │   └── treasury_fees.py         # SQL runner + CSV writer
│   └── blockfrost/
│       └── treasury_snapshot.py     # Fast API snapshot
```

---

## Principles

1. **Catalyst-scoped** — We focus on Project Catalyst funding transparency. Treasury macro analysis is informational context only, not our primary mission.
2. **Receipts-first** — Every claim must trace to a source (API, scrape, on-chain). Adopt BEACNpool's provenance discipline.
3. **Signals, not accusations** — Concentration metrics and risk indicators are signals for further investigation, not verdicts.
4. **ADA + USD** — With the shift to ADA-denominated grants, dual-currency display is essential for accuracy.
5. **Incremental enrichment** — Each phase delivers standalone value. No phase blocks the platform from functioning.
