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
