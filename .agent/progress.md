# PROOF Progress Tracker

> Quick-glance milestone status and current work

**Last Updated:** 2026-02-12  
**Current Focus:** Milestone 6 — Data Accessibility + Acquisition

---

## Milestone Overview

| # | Milestone | Status | Tasks | Progress |
|---|-----------|--------|-------|----------|
| 1 | Project Setup | ✅ Complete | 5/5 | 100% |
| 2 | Core Schema | ✅ Complete | 3/3 | 100% |
| 3 | Basic UI | ✅ Complete | 4/4 | 100% |
| 4 | Catalyst Ingestion | 🔄 In Progress | 2/5 | 40% |
| 5 | Fund Dashboard | ✅ Complete | 4/4 | 100% |
| 6 | Data Export | ✅ Complete | 2/2 | 100% |
| 7 | Community Reviews | ⏳ Pending | 0/6 | 0% |
| 8 | Accountability Scoring | ⏳ Pending | 0/3 | 0% |
| 9 | Voting Data | ⏳ Pending | 0/4 | 0% |
| 10 | Red Flag Detection | ⏳ Pending | 0/5 | 0% |
| 11 | Milestone Tracking | ⏳ Pending | 0/4 | 0% |
| 12 | Monthly Reports | ⏳ Pending | 0/3 | 0% |
| 13 | Communities & Groups | ⏳ Pending | 0/3 | 0% |
| 14 | Advanced Analytics | ⏳ Pending | 0/4 | 0% |
| 15 | GitHub Integration | ⏳ Pending | 0/2 | 0% |
| 16 | Completion NFTs | ⏳ Pending | 0/2 | 0% |
| 17 | AI Discovery | ⏳ Pending | 0/4 | 0% |
| 18 | Proposal Tinder | ⏳ Pending | 0/3 | 0% |
| 19 | On-Chain Transactions | ⏳ Pending | 0/5 | 0% |
| 20 | OpenAPI Spec | ⏳ Pending | 0/2 | 0% |
| 21 | Reviewer Profiles | ⏳ Pending | 0/4 | 0% |

---

## Current Task

```
ID:          PROOF-032
Title:       Design User authentication schema
Milestone:   7 — Community Reviews
Status:      pending
```

### Acceptance Criteria
- [ ] User model with walletAddress, email, displayName
- [ ] Session management schema
- [ ] Wallet signature verification logic documented

---

## Recently Completed

| Task | Title | Completed |
|------|-------|-----------|
| PROOF-031 | Scrape milestone reports | 2026-02-12 |
| PROOF-030 | Ingest scraped proposals into core schema | 2026-02-12 |
| — | PRD + Tasks for transparency features | 2026-02-12 |

---

## Blockers

| Issue | Blocking | Resolution |
|-------|----------|------------|
| Catalyst Milestone API requires key | PROOF-051 | Request access or scrape public pages |
| Full ingestion running | PROOF-032+ | ~84% complete, continuing in background |

---

## Key Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Proposals ingested | ~9,500 | 11,000+ |
| People tracked | ~4,900 | 5,000+ |
| Funds tracked | 14 | 14 |
| Total tasks | 85 | — |
| Tasks completed | ~25 | 85 |

---

## Files to Update After Each Task

1. **`tasks.json`** — Mark task complete, add date
2. **`progress.md`** — Update milestone progress, current task
3. **`prisma/schema.prisma`** — If schema changed
4. **`CHANGELOG.md`** — Add entry for completed work

---

## Session Notes

_Use this section for important notes that should persist across sessions._

- **2026-02-12:** Created transparency-features PRD with 15 phases
- **2026-02-12:** Added 85 tasks covering all CatalystExplorer 2.0 features + more
- **2026-02-12:** Full ingestion running (~9,500 proposals so far)
- **2026-02-12:** Completed PROOF-029 proposal scraper enhancements
- **2026-02-12:** Completed PROOF-030 scraped proposal ingestion script
- **2026-02-12:** Completed PROOF-031 milestone scrape tooling
