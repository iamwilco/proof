# Feedback Analysis — Feb 16, 2026

## Summary

PROOF has a solid foundation: 11,356 projects, 5,699 people, 14 funds (F2–F15) ingested from the Catalyst Explorer API. However, the platform suffers from **data hollowness**—every secondary data layer (milestones, reviews, deliverables, GitHub, on-chain, ROI) is empty (0 records). This makes the project detail pages appear sparse, ROI calculations meaningless, and completion tracking non-functional.

Key issues stem from:
- **No milestone ingestion pipeline** — milestones.projectcatalyst.io has no public API; our `ingest-milestones.ts` requires a JSON payload that has never been sourced
- **Missing GitHub/on-chain data** — admin sync endpoints exist but `githubUrl` and `onchainAddress` are null for all 11,356 projects
- **Static currency conversion** — hardcoded $0.35 ADA/USD instead of historical rates per fund
- **Broken external links** — `catalystUrl` is null for all projects (API returns empty `link` field); generated `milestonesUrl` likely points to wrong IDs
- **Incomplete wallet verification** — signature verification is a placeholder (trusts client-side)
- **Empty graph data** — only project↔person and project↔fund edges; no org links, no centrality metrics

---

## Issue Breakdown

### 1. Milestones: 0 Records

**Cause**: `ingest-milestones.ts` reads from a local JSON file (`--payload`), but no such file has ever been created. The Milestone Module on milestones.projectcatalyst.io is internal—no public REST API.

**Fix**:
- Build a Python scraper (`scrape_milestones.py`) using Playwright to extract milestone data from public project pages on milestones.projectcatalyst.io
- Output structured JSON matching `MilestoneRecord` interface
- Run `ingest-milestones.ts --payload` with the scraped data
- Alternatively: request JSON exports from IOG/Catalyst team via forum.cardano.org

**Impact**: Without milestones, deliverable score = 0 (30% of ROI weight), completion tracking is broken, and project detail pages show "0% complete" for all 2,182 funded projects.

### 2. External Links: catalystUrl is NULL

**Cause**: The `proposal.link` field from the Catalyst Explorer API returns null/empty. Our ingestion code sets `catalystUrl = proposal.link || null`, which resolves to null.

**Fix**:
- Construct `catalystUrl` from `sourceUrl` (which IS populated and correct): it already points to `catalystexplorer.com/en/proposals/{slug}`
- Validate `milestonesUrl` — currently uses Catalyst Explorer `externalId`, which may not be the milestones module project ID
- Add URL health-check validation (HEAD request) to external link generation

### 3. ADA/USD Conversion: Static Rate

**Cause**: `src/lib/currency.ts` uses a hardcoded `DEFAULT_ADA_USD_RATE = 0.35`. Real rates varied significantly: F10 ($1.20), F11 ($0.32), F12 ($0.27), F13 ($0.25), F14 ($0.45).

**Fix**:
- Create a `FUND_HISTORICAL_RATES` lookup table with ADA/USD at each fund's result date
- Optionally integrate CoinGecko Historical API for precise rates
- Re-run currency normalization for all ADA-denominated projects (F10–F15)

### 4. GitHub Data: 0 Projects

**Cause**: `githubUrl` is null for all projects. The Catalyst Explorer API doesn't return GitHub URLs. The admin GitHub sync endpoint (`/api/admin/github/sync`) exists but has no URLs to sync.

**Fix**:
- Add GitHub URL extraction to ingestion: parse project `website` fields for github.com URLs
- Scrape project websites for GitHub links in description/solution text
- Add admin UI for manual GitHub URL linking
- Then trigger GitHub sync to populate stars/forks/activity metrics

### 5. On-Chain Data: 0 Projects

**Cause**: Same pattern — `onchainAddress` is null for all projects. The on-chain sync endpoint exists but has nothing to sync.

**Fix**:
- Cross-reference Catalyst funding transaction addresses with project wallets
- Parse milestone payment `txHash` fields (once milestones are ingested) to discover project addresses
- Add admin UI for manual wallet address linking
- Then trigger on-chain sync

### 6. ROI Scores: 0 Calculated

**Cause**: All four ROI input components (GitHub: 0, Deliverables: 0, On-chain: 0, Community: 0) are empty. Running recalculate would produce all-zero scores.

**Fix**: Depends on fixing issues 1, 4, 5 first. Priority order:
1. Ingest milestones → deliverable scores become meaningful
2. Extract GitHub URLs → GitHub scores become meaningful
3. Enable community reviews → community scores become meaningful
4. Then run ROI recalculation

### 7. Wallet Authentication: Placeholder Verification

**Cause**: `src/lib/auth/verify.ts` line 85–90 has a TODO comment. The actual COSE signature verification is commented out. Currently trusts any client-provided signature.

**Fix**:
- Install `@emurgo/cardano-serialization-lib-nodejs` (or `@meshsdk/core`)
- Implement actual COSESign1 verification
- Add integration tests with known-good signatures

### 8. Graph Connections: Sparse

**Cause**: Only project↔person (from team data) and project↔fund edges exist. No organization links (ProjectOrganization table is empty), no cross-fund connections.

**Fix**:
- Extract organization data from Catalyst Explorer (if available)
- Add admin connection creation UI (AdminConnection model exists but unused)
- Compute centrality metrics (betweenness, degree) in ETL, store in graph API response
- Add cross-fund team overlap detection

### 9. Project Detail Page: Data Sparsity

**Cause**: Most sections render conditionally — since milestones, GitHub, on-chain, links, reviews, flags, voting records are all empty, the page appears nearly blank below the header.

**Fix** (already partially done):
- ✅ Proposal Details section (problem/solution/experience) added
- ✅ External links use stored URLs instead of constructed ones
- ✅ Slug-based URLs with redirect
- TODO: Add "Data Availability" indicator showing which data layers are populated
- TODO: Show fund-level context (how this project compares to fund averages)

---

## Limits & Recommendations

### Hard Limits
- **No public milestones API**: milestones.projectcatalyst.io Milestone Module is internal. Options: scrape (ethically, with rate limiting), request access via forum.cardano.org, or use Catalyst Explorer summary data
- **PoA evidence is submit-only**: Detailed Proof of Achievement evidence is not queryable from any public endpoint. We can only scrape what's visible on project pages
- **No internet in agent env**: Cannot test wallet connect, external API calls, or scraping from within this environment

### Recommendations
1. **Contact IOG/Catalyst team** for milestone data exports — post on forum.cardano.org or reach out via X/Twitter to the Catalyst team
2. **Prioritize data ingestion over UI polish** — the platform looks empty because it IS empty below the surface
3. **Start with Catalyst Explorer API v1** for any additional data fields we may be missing (check `/proposals/{id}` endpoint for GitHub, links, milestones summary)
4. **Build incremental**: milestone scraper → GitHub extraction → on-chain linking → ROI calculation
5. **Add data quality dashboard** visible to admins showing ingestion coverage per data layer

---

## Clarification Answers (Feb 16, 2026)

### 1. Milestones: Build a Scraper ✅
**Decision**: Build a scraper. Official sources (milestones.projectcatalyst.io, Catalyst Explorer API) do not expose milestone data via any public API. The Milestone Module is internal to IOG's infrastructure with no REST/GraphQL endpoint. Community requests for API access have gone unanswered. The only way to obtain milestone, SoM, and PoA data is by scraping the public-facing project pages on milestones.projectcatalyst.io.

**Rationale for scraping**:
- milestones.projectcatalyst.io renders milestone data in the browser but has no documented API
- Catalyst Explorer API v1 (`/proposals`) returns proposal metadata but zero milestone detail
- IOG has not published milestone data exports or opened an API
- Forum requests (forum.cardano.org) for data access have not yielded results
- The data IS publicly visible on project pages — scraping public content is the only viable path

### 2. GitHub URLs: Both Approaches ✅
**Decision**: Extract GitHub URLs from proposal text fields (problem, solution, website, description) AND add an admin UI for manual GitHub URL linking. Both approaches complement each other — automated extraction catches the majority, manual linking fills gaps.

### 3. ADA/USD Rates: Static Lookup ✅
**Decision**: Use a static lookup table with exact ADA/USD values sourced from Project Catalyst fund pages, which show both ADA and USD values for each fund. No CoinGecko integration needed.

### 4. Wallet Connect: Broken in Testing ✅
**Decision**: User has multiple wallet extensions installed and tested with a live wallet — authentication failed. Root cause is the placeholder signature verification in `verify.ts` (lines 85-90) which skips actual COSE verification. Need to debug the full auth flow: client-side wallet connection → signature request → server verification → session creation.

### 5. External Links: Use projectcatalyst.io ✅
**Decision**: Use `projectcatalyst.io` URLs instead of `catalystexplorer.com`. PROOF's goal is to become the alternative to Catalyst Explorer — relying on the competitor's URLs would be counterproductive. Construct links to `milestones.projectcatalyst.io` and `projectcatalyst.io` where possible.

### 6. Milestone Scraper Scope: Fund 14 Only ✅
**Decision**: Start with Fund 14 only as a proof of concept. If it works, expand to other funds later. Fund 14 has 122 funded projects — a manageable test set.

### 7. On-Chain: Manual Entry for Now ✅
**Decision**: Manual wallet address entry only. There is no reliable automated way to determine a project's wallet address — Catalyst funding goes through IOG treasury, not directly to project wallets. The only way to link wallets is for proposers to self-report or for admins to manually enter known addresses.

### 8. URL Validation: Yes ✅
**Decision**: HEAD-request validate all external URLs. Remove or flag URLs that return 404.

### 9. ROI Trigger: Admin-Triggered with Frontend ✅
**Decision**: ROI remains admin-triggered via API, but must have a frontend button on the admin dashboard to trigger recalculation.

### 10. Graph: Needs Major UX Overhaul ✅
**Decision**: The graph is currently unusable — "a huge mess" with no actionable insights. Edge thickness for funding amounts doesn't work. Need to:
- Fix edge thickness rendering based on funding amounts
- Improve layout algorithm for readability (reduce overlaps)
- Add meaningful filtering and clustering
- Make funding labels visible and correct
- Consider limiting visible nodes or adding progressive disclosure

---

## Priority Matrix (Updated)

| Priority | Area | Effort | Impact |
|----------|------|--------|--------|
| P0 | Fix external links → projectcatalyst.io | 2h | Immediate UX fix |
| P0 | Historical ADA/USD rates (static lookup) | 3h | Fixes all USD amounts for F10+ |
| P0 | Fix graph visualization (thickness, layout, readability) | 6h | Currently unusable |
| P1 | Build milestone scraper (Fund 14 only) | 6h | Proof of concept for data pipeline |
| P1 | Extract GitHub URLs (auto + admin UI) | 5h | Unlocks 30% of ROI |
| P1 | Debug wallet connect auth flow | 4h | Broken for real users |
| P2 | On-chain manual entry admin UI | 3h | Unlocks 25% of ROI (long-term) |
| P2 | URL validation (HEAD requests) | 3h | Data quality |
| P2 | ROI calculation with admin trigger UI | 3h | Analytics feature |
| P3 | Data availability indicators | 3h | Transparency about data gaps |
