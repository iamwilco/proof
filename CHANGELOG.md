# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
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
