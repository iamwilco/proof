This feedback synthesizes recent brainstorming and implementation suggestions for PROOF. Key themes:

ROI/Impact Measurement: Catalyst projects span diverse types (e.g., YouTube content, stablecoin dev, educational articles, events). Current scoring (GitHub/on-chain/deliverables) favors technical projects; need category-specific KPIs for fairness/transparency. Build on existing community voting (reviews/flags) with weighted, transparent formulas.
Entity Connections: Enhance identity resolution for people/orgs/projects to track aggregate funding/completion (e.g., one person under multiple grants/orgs). Use fuzzy matching + manual disputes to avoid false positives.
Priorities from Prior Feedback: Complete F14/15 ingestion, milestone scraping, and ROI dashboard to unblock analytics.

These tasks are prioritized (High/Med/Low) and designed for small, reversible commits. Each includes: Description, References (files/schema), Acceptance Criteria, and Est. Effort. Hand to Claude Code for sequential implementation—test via npm run dev + manual ingestion runs.
Tasks
Section 1: Data Ingestion Enhancements (High Priority)
Focus: Unblock full F14/15 sync and milestone data for accurate ROI baselines.

Update Catalyst Ingestion for F14/15 Deltas + Currency Normalization
Description: Enhance scripts/ingest-catalyst.ts with CLI fund filtering, delta sync via updated_at cutoff, and USD normalization (F2-F9 USD, F10+ ADA @ $0.35 or CoinGecko fetch). Recompute fund aggregates post-upsert.
References: scripts/ingest-catalyst.ts, prisma/schema.prisma (Project.fundingAmount), add normalize-currency.ts.
Acceptance Criteria:
Run npx tsx scripts/ingest-catalyst.ts --fund=15 ingests ~1,200 proposals without duplicates.
All amountReceived in USD; query SELECT AVG(amountReceived) FROM "Project" WHERE fund_number=15 returns normalized values.
No rate limit errors (add exponential backoff).

Est. Effort: 2-3 hours.

Implement Milestone Scraper to JSON Export
Description: Build etl/catalyst/scrape_milestones.py to crawl milestones.projectcatalyst.io/projects/{catalystId}, extract milestone fields (title, status, somStatus, etc.), and dump to ./data/milestones-fund{fund}.json. Integrate with project IDs from ingestion.
References: etl/requirements.txt (add if needed: none), scripts/ingest-milestones.ts, selectors from site inspection.
Acceptance Criteria:
Run python etl/catalyst/scrape_milestones.py --fund=14 generates JSON with ~400 entries.
Feed to npx tsx scripts/ingest-milestones.ts --payload ./data/milestones-fund14.json populates milestonesCompleted.
Rate-limited (1 req/sec); logs errors for failed IDs.

Est. Effort: 3-4 hours.


Section 2: Entity Connections & Identity Resolution (High Priority)
Focus: Better linking for per-person/org funding tracking (e.g., "Individual X: $150K across 3 projects, 60% completion").

Enhance Identity Resolution with Disputes & Aggregate Queries
Description: In etl/catalyst/identity_resolution.py, add disputeScore to PersonRecord (decrement on flags/low similarity). Expose API /api/people/[id]/aggregates for funding/completion sums across linked projects/orgs. Add manual merge UI in /admin/connections.
References: etl/catalyst/identity_resolution.py (update threshold to dynamic 0.8-0.9), prisma/schema.prisma (add Person.disputeScore), src/app/api/people/[id]/aggregates/route.ts.
Acceptance Criteria:
Fuzzy match merges 80%+ of test aliases (e.g., "John Doe" ↔ "J. Doe Inc."); disputes flag <0.7 scores.
Query /api/people/abc-123/aggregates returns { totalFunding: 150000, completionRate: 0.6, projectCount: 3 }.
Admin UI allows 1-click merges with audit log.

Est. Effort: 4-5 hours.

Add Organization Linking & Junction Table Upserts
Description: During ingestion, parse descriptions/links for org mentions (e.g., via regex/NER in etl/catalyst/link_extraction.py). Upsert to ProjectOrganization junction; query aggregates like person totals but for orgs.
References: prisma/schema.prisma (ProjectOrganization model), src/app/organizations/[id]/page.tsx (add aggregates section).
Acceptance Criteria:
20%+ projects auto-link to orgs (e.g., "Built by Acme Corp" → orgId).
Org profile shows { totalFunding: 500000, avgCompletion: 0.75, linkedPeople: 5 }.
No doxxing: Only public links.

Est. Effort: 3 hours.


Section 3: ROI/Impact Enhancements (Medium Priority)
Focus: Fair scoring for diverse project types; integrate community input.

Category-Specific KPI Mapping & Weighted Scoring
Description: Extend src/lib/roi.ts with a kpiMap object (e.g., YouTube: views/subs; Events: attendance; Articles: reads/shares; Stablecoin: TVL/txns). Dynamically weight based on category (e.g., content=0.5 YouTube, 0.3 community). Recalc on ingestion.
References: src/lib/roi.ts (add WEIGHTS.category), prisma/schema.prisma (Project.category), new etl/kpi_fetchers.py for YouTube (API key via env).
Acceptance Criteria:
Sample: YouTube project scores 85 (views>10K) vs. stablecoin 70 (TVL>50K ADA).
Formula: roiScore = sum(categoryKPI * weight) + (communityVote * 0.2); percentiles update.
Transparent: Detail breakdown in ProjectROI table.

Est. Effort: 5-6 hours.

Integrate Community Voting into ROI (e.g., Alignment/Feasibility Weights)
Description: In src/lib/roi.ts, pull avg alignmentScore/feasibilityScore from Reviews; weight 20% in final score. Add "Impact Type" selector in review form for category-specific input.
References: src/app/api/reviews/route.ts, Review model (add impactType?), existing voting in src/components/ReviewForm.tsx.
Acceptance Criteria:
Low community score (-10% to roiScore) for flagged projects.
Form: Dropdown "YouTube Views / Event Attendance / etc." auto-feeds KPI.
Recalc ROI on new reviews (TanStack Query invalidation).

Est. Effort: 2-3 hours.


Section 4: UI/Analytics Polish (Medium Priority)
Focus: Visualize connections and diverse impacts.

Build ROI Dashboard with Category Filters & Heatmap
Description: Implement /reports/roi/page.tsx with TanStack filters (category/fund), top/bottom tables, and Plotly scatter (funding vs. ROI, colored by type). Add org/person aggregate views.
References: Prior snippet in feedback, src/app/reports/roi/page.tsx, add npm i plotly.js react-plotly.js.
Acceptance Criteria:
Filter "Events" shows avg ROI 65; heatmap flags low-performers (roi<30).
Export CSV button for audits.
Loads <2s for 100 projects.

Est. Effort: 4 hours.

Enhance Network Graph for Funding Flows & Types
Description: Update src/app/graph/GraphClient.tsx to edge-label funding amounts, node-color by category/ROI, and tooltip with aggregates (e.g., "Person X: $150K, 60% complete").
References: src/app/graph/GraphClient.tsx (Cytoscape stylesheet), fetch from /api/graph?type=aggregates.
Acceptance Criteria:
Sankey-style flow: Funds → Orgs/People → Projects (via NetworkX in ETL).
Hover: "Total for Node: Funding $X, Completion Y%".

Est. Effort: 3 hours.


Section 5: Testing & Hardening (Low Priority)

Add Data Quality Checks & Monitoring Alerts
Description: In /api/health, add checks for ingestion completeness (e.g., F15 proposals=1200?). Email on discrepancies >10% (use Nodemailer).
References: /api/health/route.ts, etl/requirements.txt (nodemailer? Wait, Python—use smtplib).
Acceptance Criteria: Dashboard shows "Ingestion Health: 98%" green/red.
Est. Effort: 2 hours.