# Milestone Scraper Rationale

## Why We Must Build a Scraper

### The Problem
PROOF needs milestone data (Statement of Milestone, Proof of Achievement, reviewer feedback, payment status) to calculate meaningful ROI scores, track project completion, and provide transparency. Without milestones, 30% of the ROI weight produces zero, completion tracking is broken, and project detail pages show "0% complete" for all 2,182 funded projects.

### Official Sources Have No Valid Data Access

**1. milestones.projectcatalyst.io — No Public API**
- The Milestone Module is internal to IOG's infrastructure
- No REST API, no GraphQL endpoint, no documented data export
- Data is rendered in the browser via server-side rendering but is not programmatically accessible
- The site does display milestone data publicly on project pages — but only via HTML

**2. Catalyst Explorer API v1 — No Milestone Data**
- Endpoint: `https://www.catalystexplorer.com/api/v1/proposals`
- Returns: proposal metadata (title, problem, solution, funding, team, votes)
- Does NOT return: milestones, SoM/PoA status, evidence, reviewer feedback, payment info
- The `/proposals/{id}` detail endpoint also does not include milestone data

**3. IOG Data Exports — Not Available**
- IOG has not published milestone data exports
- Community requests for API access on forum.cardano.org have not yielded results
- No official data dump or CSV export has been made available

**4. IdeaScale — Deprecated**
- IdeaScale was the original proposal platform but has been sunset
- Historical data may exist but is not publicly accessible
- No API access for milestone tracking

### The Only Viable Path: Scraping Public Pages

milestones.projectcatalyst.io renders milestone data publicly on individual project pages. This data includes:
- Milestone titles and descriptions
- Statement of Milestone (SoM) status and content
- Proof of Achievement (PoA) status and content
- Reviewer feedback and approval status
- Payment status and amounts
- Evidence URLs and output links

Since this data is publicly visible to any browser user, scraping it is the only viable way to populate our database.

### Scraping Approach

- **Tool**: Python + Playwright (headless browser to handle JS-rendered content)
- **Scope**: Fund 14 only (122 funded projects) as initial proof of concept
- **Rate limiting**: 1 request per second with User-Agent header identifying PROOF
- **Output**: Structured JSON matching our `MilestoneRecord` TypeScript interface
- **Ingestion**: Feed JSON to existing `ingest-milestones.ts --payload` script
- **Expansion**: If Fund 14 PoC succeeds, extend to other funds incrementally

### Ethical Considerations

- Data is publicly visible — no authentication bypass required
- Rate-limited to avoid server load (1 req/sec)
- User-Agent header identifies our scraper
- Data is used for public good (accountability transparency)
- We credit the source and link back to original pages

---

*Document created: Feb 16, 2026*
*Decision: Build scraper because no official API or data export exists*
