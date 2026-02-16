# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- External links now point to `milestones.projectcatalyst.io` (official IOG source) instead of `catalystexplorer.com`.
- `catalystUrl` populated for all 11,356 projects (was null for all).
- `explorerUrl` cleared — PROOF replaces Catalyst Explorer, no need to link to competitor.
- Removed duplicate milestones/explorer links from project detail page; single "View on Project Catalyst" link.
- Cleaned up unused `generateSlug` function and `projectSlug` variable from project detail page.
- ADA→USD conversion now uses per-fund historical rates instead of static $0.35 default.
- `FUND_HISTORICAL_RATES` lookup: F10=$0.252, F11=$0.377, F12=$0.451, F13=$0.348, F14=$0.401, F15=$0.352.
- 7,017 projects across F10-F15 re-normalized with accurate USD equivalents.
- `getNormalizationInfo()` now reports rate source (historical vs default) per fund.
- Single-proposal enrichment: fetches detailed data from Catalyst Explorer `/proposals/{id}` for all 11,356 projects.
- New schema fields: `impact`, `feasibility`, `teamDescription`, `budgetBreakdown`, `alignmentScore`, `feasibilityScore`, `auditabilityScore`, `opensourced`.
- GitHub URL extraction from all proposal text fields (1,589 projects = 14% of total).
- Project detail page now shows: Expected Impact, Feasibility, Team, Budget Breakdown, Reviewer Scores (1-5 with progress bars), Open Source badge, project duration badge.

### Fixed
- Sidebar layout: aligned to left edge with fixed positioning, made nav scrollable, fixed z-index overlap with header.
- Dark mode styling: comprehensive rework across funds, projects, people, organizations pages for proper contrast and readability.
- Theme toggle: defaulted to dark mode, added inline script to prevent flash of unstyled content on page load.
- Google OAuth: redirect to login page with error message instead of JSON response when not configured.
- Project action forms: conditionally hidden for non-authenticated users, showing login prompts instead.
- Database schema sync: ran `prisma db push` to add missing columns (githubStars, etc.) and tables.
- Build errors: Added Suspense boundaries for useSearchParams, fixed opengraph-image export, added force-dynamic to pages with DB calls.
- ConnectionHoverCard: guard aborted fetch cleanup to avoid AbortError on unmount.
- Rankings: force dynamic rendering to avoid Performance.measure negative timestamp error.
- Organizations/Milestones: force dynamic rendering and add actionable empty states for missing data.
- Projects: trim search input and include related people/org matches to return results reliably.
- Design system: default dark mode and normalize page background colors via theme variables.
- Design system: align input/textarea/select styling for dark mode visibility.
- Navigation: replace top nav with collapsible sidebar layout plus mobile bottom bar.
- Auth: add protected route gating with login redirects for restricted areas.
- Admin: enforce admin access checks and improve disputes page dark-mode styling.

### Added
- Proposal Tinder 2.0 accountability overlays (score badge, completion/on-time stats, red flag indicators).
- Proposer hover card with track record details on Discover cards.
- Smart ordering in /api/discover based on accountability and flags.
- Connection explorer hover cards with mini-graph view and shared proposals.
- Organization accountability score aggregation with team consistency modifiers.
- Score preview period workflow with disputes, audits, and auto-publish.
- Score transparency UI with breakdown, confidence, and trend indicators.
- GitHub metrics integration and activity snapshots on projects and organizations.
- On-chain metrics integration with optional manual address entry and Blockfrost sync.
- ROI calculation engine with outcome scoring (GitHub, deliverables, on-chain) and percentile rankings.
- ROI dashboard at /analytics/roi with fund comparison, category benchmarks, top/bottom tables, and CSV export.
- Automated red flag detection with admin notifications (repeat delays, ghost projects, overdue milestones, funding clusters, similar proposals).
- Community flag system with submission form, moderator review queue at /admin/flags, and proposer response workflow.
- Flag impact on accountability scores: severity-weighted penalties (low=3, medium=7, high=15, critical=25 points), capped at 50.
- Enhanced knowledge graph with search, score filters, flagged-only filter, builder/grifter color coding, and organization nodes.
- Code quality: Fixed TypeScript errors in route handlers (Next.js 15 Promise params), updated Notification schema with user notifications support.
- Milestone progress tracker for transparency roadmap.
- Agent session prompt updates to include feature PRD and progress tracking.
- Scraped proposal ingestion script for projectcatalyst.io (`etl/catalyst/ingest_scraped_proposals.py`).
- Milestone scraping tool for milestones.projectcatalyst.io (`etl/catalyst/scrape_milestones.py`).
- User/session auth schema for wallet-based authentication.
- Cardano wallet login endpoints and login UI wiring.
- Review and review vote schema for community reviews.
- Review API endpoints for list/create/vote.
- Review UI section for submitting and browsing reviews.
- Reviewer leaderboard page for top reviewers.
- Accountability score schema for person reputation.
- Accountability score calculation engine API.
- Accountability API endpoints and UI badge for people profiles.
- Voting record schema for proposal voting data.
- Voting data source research notes for Catalyst and Jörmungandr.
- Voting data ingestion script with rankings and freshness timestamps.
- Voting UI components: VotingStats, RankingBadge, VotingTrendsChart.
- Voting analytics dashboard page with fund-wide statistics.
- Voting data integrated on project detail and list pages.
- Flag schema for automated and community red flag detection.
- Automated red flag detectors: repeat delays, ghost projects, overdue milestones, funding clusters.
- Flag detection API endpoint with run/list/update operations.
- Community flag submission UI with category selector and evidence URL input.
- FlagSection component integrated on project detail pages.
- Flag review dashboard with status filters, type filters, and action buttons.
- FlagActions component for confirm/dismiss/resolve workflows.
- Flagged projects indicator: badge on project cards, warning banner on detail pages.
- Flag status filter on projects listing page.
- Milestone data sources research documentation.
- Extended Milestone schema with Catalyst SoM/PoA fields and evidence tracking.
- Milestone ingestion script and payload example for manual sync.
- Milestone tracking UI with SoM/PoA status badges and evidence links.
- Milestone status dashboard with filters and CSV export.
- Monthly reports schema with submission form and report history.
- Monthly reports moderation dashboard with approve/flag actions.
- Report moderation export support and status tracking.
- Similar proposal detection using lightweight text similarity scoring.
- Community flagging UI completion (button, form, evidence input).
- Milestone calendar view with month navigation, filters, and iCal export.
- Community schema with Community and CommunityProject join table models.
- Community pages with index listing, detail view, and stats dashboard.
- Organization profiles with accountability score, team listing, and cross-proposal view.
- Fund comparison dashboard with multi-fund selector, metrics table, and category breakdown.
- Proposer leaderboards with sorting by funding, completion rate, and project count.
- Enhanced knowledge graph with view modes (default, centrality, clusters, funding flow).
- Predictive analytics with funding success, completion probability, and risk assessment.
- GitHub integration with repo linking, API integration, and activity score calculation.
- GitHub activity dashboard with activity distribution chart and project listing.
- Completion NFT schema with metadata, minting tracking, and verification status.
- NFT minting library with verification workflow, wallet verification, and stats.
- AI/LLM infrastructure with OpenAI integration, embeddings, vector store, and rate limiting.
- AI proposal comparison with side-by-side view, similarity analysis, and overlap detection.
- AI natural language search with chat interface, fund filtering, and follow-up suggestions.
- AI recommendation engine with user interactions, collaborative filtering, and explanations.
- Bookmark schema with Bookmark and BookmarkList models for named collections.
- Proposal Tinder swipe UI with card stack, swipe gestures, and keyboard shortcuts.
- Bookmark management UI with list page, CSV export, and sidebar navigation.
- FundingTransaction schema for on-chain transaction tracking with USD values.
- Funding transaction ingestion via Blockfrost API with treasury address tracking.
- USD conversion service with CoinGecko API, historical prices, and formatting utilities.
- Team address tagging with wallet claiming, signature verification, and person linking.
- Funding transaction explorer UI with timeline chart, filters, and explorer links.
- OpenAPI V3 specification with all endpoints, schemas, and authentication.
- API documentation UI with endpoint list, code examples, and versioning.
- Reviewer/Moderator schema with profiles, Ideascale integration, and badges.
- Reviewer profile pages with review history, badges, and claim workflow.
- Moderator profile pages with scope assignments, stats, and activity summary.
- Reviewer/moderator data ingestion with linking, outcomes, and batch import.

### Changed
- Catalyst proposal scraper now includes pagination discovery and retry handling.

## [2026-02-12]
### Added
- Comprehensive Catalyst transparency PRD (`.agent/prd/transparency-features.md`).
- Detailed task backlog for transparency roadmap (`.agent/tasks/tasks.json`).
- Progress tracker (`.agent/progress.md`).

## [2026-02-11]
### Added
- Projects directory, people profiles, rankings, graph visualization, funds dashboard, export tools.
- Data ingestion scripts for CatalystExplorer API.

## [2026-02-10]
### Added
- Initial project setup, core schema, and ETL scaffolding.
