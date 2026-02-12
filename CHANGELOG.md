# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- Milestone progress tracker for transparency roadmap.
- Agent session prompt updates to include feature PRD and progress tracking.
- Scraped proposal ingestion script for projectcatalyst.io (`etl/catalyst/ingest_scraped_proposals.py`).
- Milestone scraping tool for milestones.projectcatalyst.io (`etl/catalyst/scrape_milestones.py`).
- User/session auth schema for wallet-based authentication.

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
