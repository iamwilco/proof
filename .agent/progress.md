# PROOF Progress Tracker

> Quick-glance milestone status and current work

**Last Updated:** 2026-02-13  
**Current Focus:** Milestone 25 — Enhanced Discovery UX

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
| 9 | Voting Data | 🔄 In Progress | 4/4 | 100% |
| 10 | Red Flag Detection | ✅ Complete | 6/6 | 100% |
| 11 | Milestone Tracking | ✅ Complete | 4/4 | 100% |
| 12 | Monthly Reports | ✅ Complete | 3/3 | 100% |
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
ID:          PROOF-099
Title:       Score Preview Period System
Milestone:   27 — Accountability Scoring
Status:      completed
```

### Acceptance Criteria
- [x] previewUntil field on AccountabilityScore
- [x] Notification sent when score calculated
- [x] Dispute submission form for proposers
- [x] Admin queue for dispute review
- [x] Score auto-publishes after 14 days if no dispute
- [x] Audit log of score changes

---

## Recently Completed

| Task | Title | Completed |
|------|-------|-----------|
| PROOF-099 | Score Preview Period System | 2026-02-13 |
| PROOF-098 | Organization Accountability Score | 2026-02-13 |
| PROOF-094 | Connection Explorer & Hover Cards | 2026-02-13 |
| PROOF-047b | Implement text similarity detection | 2026-02-12 |
| PROOF-056 | Add monthly reports moderation dashboard | 2026-02-12 |
| PROOF-055 | Build monthly report templates | 2026-02-12 |
| PROOF-054 | Add milestone status dashboard | 2026-02-12 |
| PROOF-053 | Create milestone tracking UI | 2026-02-12 |
| PROOF-052 | Build milestone sync mechanism | 2026-02-12 |
| PROOF-051 | Extend Milestone schema with Catalyst fields | 2026-02-12 |
| PROOF-050 | Research milestone data sources | 2026-02-12 |
| PROOF-049 | Build flagged projects indicator | 2026-02-12 |
| PROOF-048 | Build flag review dashboard | 2026-02-12 |
| PROOF-049 | Build Flag dashboard | 2026-02-12 |
| PROOF-048 | Build community flagging UI | 2026-02-12 |
| PROOF-047 | Build community flag submission UI | 2026-02-12 |
| PROOF-046 | Implement automated red flag detection | 2026-02-12 |
| PROOF-045 | Design Flag schema | 2026-02-12 |
| PROOF-044 | Build Voting UI components | 2026-02-12 |
| PROOF-043 | Build voting data ingestion | 2026-02-12 |
| PROOF-042 | Research and access voting data sources | 2026-02-12 |
| — | PRD + Tasks for transparency features | 2026-02-12 |

---

## Blockers

| Issue | Blocking | Resolution |
|-------|----------|------------|
| Catalyst Milestone API requires key | PROOF-051 | Request access or scrape public pages |
| Full ingestion running | PROOF-044+ | ~84% complete, continuing in background |

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
- **2026-02-12:** Completed PROOF-032 user auth schema additions
- **2026-02-12:** Completed PROOF-033 wallet login endpoints
- **2026-02-12:** Completed PROOF-034 review schema
- **2026-02-12:** Completed PROOF-035 review API endpoints
- **2026-02-12:** Completed PROOF-036 review UI components
- **2026-02-12:** Completed PROOF-037 reviewer leaderboard
- **2026-02-12:** Completed PROOF-038 accountability score schema
- **2026-02-12:** Completed PROOF-039 score calculation engine
- **2026-02-12:** Completed PROOF-040 accountability API + UI
- **2026-02-12:** Completed PROOF-041 voting record schema
- **2026-02-12:** Completed PROOF-042 voting data source research
- **2026-02-12:** Completed PROOF-043 voting data ingestion
- **2026-02-12:** Completed PROOF-044 voting UI components (VotingStats, RankingBadge, analytics dashboard, trends chart)
- **2026-02-12:** Completed PROOF-045 Flag schema for red flag detection
- **2026-02-12:** Completed PROOF-046 Automated red flag detectors (repeat delays, ghost projects, overdue milestones, funding clusters)
- **2026-02-12:** Completed PROOF-047 Community flag submission UI with category selector and evidence input
- **2026-02-12:** Completed PROOF-048 Community flagging UI
- **2026-02-12:** Completed PROOF-048 Flag review dashboard with filters and action buttons
- **2026-02-12:** Completed PROOF-049 Flagged projects indicator (badges, warning banner, filter)
- **2026-02-12:** Completed PROOF-050 Milestone data sources research (Milestone Module, LidoNation API)
- **2026-02-12:** Completed PROOF-051 Milestone schema extensions for SoM/PoA fields
- **2026-02-12:** Completed PROOF-052 Milestone ingestion script and payload format
- **2026-02-12:** Completed PROOF-053 Milestone tracking UI (SoM/PoA badges, evidence links)
- **2026-02-12:** Completed PROOF-054 Milestone status dashboard with filters and export
- **2026-02-12:** Completed PROOF-055 Monthly reports schema + submission UI
- **2026-02-12:** Completed PROOF-056 Monthly reports moderation dashboard
- **2026-02-12:** Completed PROOF-047b Text similarity detection for similar proposals
- **2026-02-12:** Completed PROOF-049 Flag dashboard (verified all criteria already implemented)
- **2026-02-12:** Completed PROOF-050 Design Milestone schema (verified already implemented)
- **2026-02-12:** Completed PROOF-051 Ingest milestone data (verified already implemented)
- **2026-02-12:** Completed PROOF-052 Build Milestone UI components (verified already implemented)
- **2026-02-12:** Completed PROOF-054 Design MonthlyReport schema (verified already implemented)
- **2026-02-12:** Completed PROOF-055 Ingest monthly reports (verified already implemented)
- **2026-02-12:** Completed PROOF-056 Build MonthlyReport UI (verified already implemented)
- **2026-02-12:** Completed PROOF-053 Build milestone calendar (calendar view, filters, iCal export)
- **2026-02-13:** Completed PROOF-057 Design Community schema (Community, CommunityProject models)
- **2026-02-13:** Completed PROOF-058 Build Community pages (index, detail, stats, navigation)
- **2026-02-13:** Completed PROOF-059 Build Organization profiles (index, detail, accountability score, team listing)
- **2026-02-13:** Completed PROOF-060 Build fund comparison dashboard (multi-fund selector, metrics table, category breakdown)
- **2026-02-13:** Completed PROOF-061 Build proposer leaderboards (funding, completion, projects, fund filter)
- **2026-02-13:** Completed PROOF-062 Enhance knowledge graph (view modes, cluster legend, centrality info)
- **2026-02-13:** Completed PROOF-063 Build predictive analytics (funding success, completion probability, risk score)
- **2026-02-13:** Completed PROOF-064 GitHub integration (repo linking, API integration, activity score)
- **2026-02-13:** Completed PROOF-065 Build GitHub activity dashboard (activity chart, project list, stats)
- **2026-02-13:** Completed PROOF-066 Design Completion NFT schema (metadata, minting tracking, verification)
- **2026-02-13:** Completed PROOF-067 Implement NFT minting (minting lib, verification workflow, NFT page)
- **2026-02-13:** Completed PROOF-068 Set up AI/LLM infrastructure (OpenAI, embeddings, vector store, rate limiting)
- **2026-02-13:** Completed PROOF-069 Build AI proposal comparison (side-by-side, similarities, differences, overlap)
- **2026-02-13:** Completed PROOF-070 Build AI natural language search (chat interface, fund filter, follow-ups)
- **2026-02-13:** Completed PROOF-071 Build AI recommendation engine (interactions, collaborative filtering, explanations)
- **2026-02-13:** Completed PROOF-072 Design bookmark schema (Bookmark, BookmarkList models)
- **2026-02-13:** Completed PROOF-073 Build Proposal Tinder swipe UI (card stack, swipe gestures, keyboard shortcuts)
- **2026-02-13:** Completed PROOF-074 Build bookmark management UI (list page, CSV export, list sidebar)
- **2026-02-13:** Completed PROOF-075 Design FundingTransaction schema (txHash, amount, USD value, explorer link)
- **2026-02-13:** Completed PROOF-076 Build funding transaction ingestion (Blockfrost API, treasury addresses, linking)
- **2026-02-13:** Completed PROOF-077 Build USD conversion service (CoinGecko API, historical prices, formatting)
- **2026-02-13:** Completed PROOF-078 Build team address tagging (WalletAddress model, signature verification, linking)
- **2026-02-13:** Completed PROOF-079 Build funding transaction explorer UI (timeline chart, filters, explorer links)
- **2026-02-13:** Completed PROOF-080 Generate OpenAPI V3 specification (endpoints, schemas, auth)
- **2026-02-13:** Completed PROOF-081 Build API documentation UI (endpoints list, code examples, versioned)
- **2026-02-13:** Completed PROOF-082 Design Reviewer/Moderator schema (profiles, Ideascale, badges)
- **2026-02-13:** Completed PROOF-083 Build reviewer profile pages (profile detail, history, claim workflow)
- **2026-02-13:** Completed PROOF-084 Build moderator profile pages (profile, scope, stats)
- **2026-02-13:** Completed PROOF-085 Ingest reviewer/moderator data (linking, outcomes, batch import)
- **2026-02-13:** Completed PROOF-086 Fix database schema drift - 17 missing tables and columns migrated

## Phase 2: UX Overhaul, Authentication & ROI Engine
- **2026-02-13:** Phase 2 PRD created (.agent/prd/phase2-ux-overhaul.md)
- **2026-02-13:** 21 new tasks added (PROOF-087 through PROOF-107)
- **Key Decisions:** Wallet-primary auth, GitHub+on-chain metrics only, score preview period, web-first
- **2026-02-13:** Completed PROOF-087 Design System Foundation
  - Created UI component library: Button, Card, Badge, Input, Select, Modal, Toast, Skeleton, ThemeToggle
  - Updated globals.css with design tokens for light/dark mode
  - Updated Navigation with grouped items, dark mode support, dropdown menu
- **2026-02-13:** Completed PROOF-089 Cardano Wallet Authentication
  - Created lib/auth with wallet detection, CIP-30 signature flow
  - Created WalletConnect component with modal UI
  - Added API route /api/auth/wallet for session creation
  - Added AuthNonce model for replay attack prevention
- **2026-02-13:** Completed PROOF-092 Admin Connection Management
  - Added AdminConnection model with EntityType and ConnectionType enums
  - Created /admin/connections page with form and list
  - Added API routes for CRUD operations
- **2026-02-13:** Completed PROOF-096 Feature Roadmap (static version)
  - Created /roadmap page with feature voting UI
  - Added Feature and FeatureVote models to schema
- **2026-02-13:** Applied migration: phase2_auth_features
- **2026-02-13:** Completed PROOF-088 Role-Based Navigation Architecture
  - Session-aware navigation with auth state
  - Admin links visible only to ADMIN/MODERATOR roles
  - User avatar and logout in header when authenticated
- **2026-02-13:** Completed PROOF-090 Google OAuth & Email Magic Link Auth
  - Google OAuth flow with state verification
  - Email magic link with MagicLinkToken model
  - Updated login page with all auth options
  - Applied migration: add_magic_link_token
- **2026-02-13:** Completed PROOF-091 User Profile System
  - Created /my/settings page with profile editing
  - Connected accounts display (wallet, Google)
 - **2026-02-13:** Completed PROOF-094 Connection Explorer & Hover Cards
  - Added hover card previews for people, orgs, and projects
  - Added mini graph explorer modal and shared proposals list
  - Integrated admin connections into hover card data
 - **2026-02-13:** Completed PROOF-098 Organization Accountability Score
  - Added organization accountability model + Prisma client
  - Implemented aggregate score with team consistency modifiers
  - Displayed organization badge and stored score usage
 - **2026-02-13:** Completed PROOF-099 Score Preview Period System
  - Added preview/dispute/audit models and notification hooks
  - Built proposer dispute form and admin review queue
  - Added auto-publish flow for expired preview scores
  - Profile API route for PATCH updates
- **2026-02-13:** Completed PROOF-097 Person Accountability Score Calculation
  - Created lib/accountability/scoring.ts with weighted factors
  - Completion (35%), On-time (20%), Quality (15%), Communication (15%), Community (10%), Response (5%)
  - Badge assignment: TRUSTED (80+), RELIABLE (60+), UNPROVEN (40+), CONCERNING (<40)
  - API endpoints for score retrieval and admin recalculation
- **2026-02-13:** Completed PROOF-093 Proposal Tinder 2.0 - Accountability Overlays
  - Added proposer hover card with accountability breakdown
  - Added completion/on-time stats and red flag indicators
  - Added spacebar shortcut and smart ordering in /api/discover
- **2026-02-13:** Completed PROOF-095 Enhanced Search with Faceted Filters
  - Created GlobalSearch component with autocomplete and keyboard navigation
  - Created /api/search route for cross-entity search (projects, people, orgs, funds)
  - Created ProjectFilters component with URL state management
  - Integrated GlobalSearch into Navigation header

### Phase 2 Session Summary (2026-02-13)
**9 tasks completed:**
1. Design System Foundation (UI components, dark mode, design tokens)
2. Role-Based Navigation (session-aware, admin links)
3. Cardano Wallet Authentication (CIP-30, signature verification)
4. Google OAuth & Email Magic Link (multi-provider auth)
5. User Profile System (settings page, connected accounts)
6. Admin Connection Management (manual entity linking)
7. Feature Roadmap page (voting UI)
8. Person Accountability Score Calculation (weighted algorithm)
9. Enhanced Search with Faceted Filters (global search, project filters)

**Key files created:**
- `src/components/ui/*` - Button, Card, Badge, Input, Modal, Toast, Skeleton, ThemeToggle
- `src/lib/auth/*` - wallet.ts, verify.ts, session.ts, nextauth.ts
- `src/components/auth/*` - WalletConnect, SessionProvider
- `src/lib/accountability/*` - scoring.ts
- `src/components/search/*` - GlobalSearch
- `src/components/filters/*` - ProjectFilters
- `src/app/roadmap/page.tsx` - Feature roadmap
- `src/app/admin/connections/*` - Admin connection management
- `src/app/my/settings/page.tsx` - User profile settings

**Migrations applied:**
- phase2_auth_features (UserRole enum, AuthNonce, AdminConnection, Feature, FeatureVote)
- add_magic_link_token (MagicLinkToken)
