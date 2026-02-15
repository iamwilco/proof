# PROOF Production Readiness PRD

> **Source**: Grok AI feedback synthesis (feedback-1.md)  
> **Created**: 2026-02-15  
> **Status**: Active  
> **Goal**: Production launch with core transparency features

---

## Executive Summary

This PRD consolidates feedback from AI-assisted analysis and prioritizes tasks for production launch. The focus is on **shipping core value** (transparency, accountability scores, ROI tracking) while deferring complex features that require external dependencies or ML infrastructure.

**Target**: Production-ready state with F14/F15 data, working ROI scores, and community features.

---

## Production Launch Scope

### ✅ In Scope (Must Have)

| Feature | Description | Status |
|---------|-------------|--------|
| **Full F14/F15 Ingestion** | All proposals from latest funds with normalized funding amounts | Pending |
| **Currency Normalization** | ADA→USD conversion for comparable metrics (F10+ at $0.35 default) | Pending |
| **Person Aggregates API** | `/api/people/[id]/aggregates` showing total funding, completion rate | Pending |
| **Community ROI Integration** | Factor review scores (alignment, feasibility) into ROI calculation | Pending |
| **ROI Analytics Dashboard** | `/analytics/roi` with filters by fund/category, top/bottom tables | Pending |
| **Graph Enhancements** | Edge labels for funding, aggregate tooltips on hover | Pending |
| **Data Quality Checks** | Health endpoint with ingestion completeness validation | Pending |
| **Production Polish** | Dark mode fixes, responsive tweaks, error states | Pending |

### ⏸️ Deferred (Post-Launch)

| Feature | Blocker | Timeline |
|---------|---------|----------|
| **Milestone Scraper** | No public API at milestones.projectcatalyst.io; requires HTML scraping which is fragile | Post-launch, manual JSON exports for now |
| **Category-Specific KPIs** | YouTube API requires quota approval (weeks); events/articles have no standard metrics | Future enhancement |
| **NER-based Org Extraction** | Requires ML models, high false positive risk without training data | Future enhancement |
| **Plotly Heatmaps** | Adds bundle size (~500KB), complexity; tables work fine | Nice-to-have |
| **Email Alerts** | Requires SMTP service configuration | Post-launch |
| **Dispute Workflow UI** | Design incomplete; manual moderator handling works | Post-launch |

### 📋 Feature Backlog (Nice to Have)

- Sankey-style funding flow visualization
- Admin merge UI for duplicate person identities
- CSV export for all analytics dashboards
- Mobile-optimized network graph (currently desktop-focused)
- Real-time data freshness indicators
- Webhook notifications for flag changes

---

## Technical Specifications

### 1. Currency Normalization

**Problem**: Catalyst funds F2-F9 were denominated in USD, F10+ in ADA. Direct comparison is misleading.

**Solution**:
```typescript
// src/lib/currency.ts
const ADA_USD_RATE = parseFloat(process.env.ADA_USD_RATE || '0.35');

export function normalizeToUSD(amount: number, fundNumber: number): number {
  if (fundNumber >= 10) {
    return amount * ADA_USD_RATE;
  }
  return amount; // Already USD
}
```

**Schema Change**: Add `fundingAmountUSD` computed field or normalize on ingestion.

**Acceptance Criteria**:
- All funding amounts queryable in USD
- Original ADA amounts preserved for display
- Rate configurable via environment variable

---

### 2. Person Aggregates API

**Endpoint**: `GET /api/people/[id]/aggregates`

**Response**:
```json
{
  "personId": "abc-123",
  "totalFundingUSD": 150000,
  "projectCount": 5,
  "completedCount": 3,
  "completionRate": 0.6,
  "avgROI": 72,
  "fundBreakdown": [
    { "fund": 14, "projects": 2, "funding": 50000 },
    { "fund": 15, "projects": 3, "funding": 100000 }
  ]
}
```

**Implementation**: Prisma aggregation query on `ProjectTeamMember` → `Project`.

---

### 3. Community ROI Integration

**Current Formula**:
```
ROI = (GitHub × 0.4) + (Deliverables × 0.3) + (OnChain × 0.3)
```

**Updated Formula**:
```
ROI = (GitHub × 0.35) + (Deliverables × 0.25) + (OnChain × 0.25) + (Community × 0.15)

Community Score = avg(alignmentScore, feasibilityScore, auditabilityScore) from Reviews
```

**Acceptance Criteria**:
- ROI recalculates when new reviews are submitted
- Projects with <3 reviews use previous formula (no community weight)
- Score breakdown shows community component

---

### 4. ROI Analytics Dashboard

**Route**: `/analytics/roi`

**Features**:
- Filter by: Fund, Category, Status
- Sort by: ROI (asc/desc), Funding, Completion Rate
- Tables: Top 10 ROI, Bottom 10 ROI
- Stats: Average ROI by fund, category breakdown
- Export: CSV download button

**No Plotly**: Use native tables and simple bar charts (CSS or lightweight library).

---

### 5. Graph Enhancements

**Changes to** `src/app/graph/GraphClient.tsx`:

1. **Edge Labels**: Show funding amount on project→fund edges
2. **Node Colors**: Color by ROI tier (green >70, yellow 40-70, red <40)
3. **Tooltips**: Show aggregates on hover
   - Person: "Total Funding: $X | Projects: Y | Completion: Z%"
   - Project: "ROI: X | Status: Y | Funding: $Z"

---

### 6. Ingestion CLI Enhancements

**Current**: `npx tsx scripts/ingest-catalyst.ts`

**Enhanced**:
```bash
# Filter by fund
npx tsx scripts/ingest-catalyst.ts --fund=15

# Delta sync (only updated since date)
npx tsx scripts/ingest-catalyst.ts --since=2026-02-01

# Full refresh
npx tsx scripts/ingest-catalyst.ts --full
```

**Implementation**: Parse `process.argv` for flags, filter API queries accordingly.

---

## Data Dependencies

| Data Source | Status | Notes |
|-------------|--------|-------|
| Catalyst Explorer API | ✅ Working | Rate limited, use backoff |
| GitHub API | ✅ Working | Requires `GITHUB_TOKEN` |
| Blockfrost API | ✅ Working | Free tier sufficient |
| Milestones Portal | ⚠️ Manual | No API; use JSON exports |
| YouTube API | ❌ Not Ready | Quota approval required |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Catalyst API rate limits | Medium | Exponential backoff, caching |
| Identity resolution false positives | Medium | Conservative 86% threshold, manual review |
| ROI scoring perceived as unfair | High | Transparent methodology, score breakdowns |
| Missing milestone data | Medium | Document limitation, manual updates |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| F14/F15 proposals ingested | 100% |
| Accountability scores calculated | >90% of active proposers |
| Page load time | <2s |
| Mobile responsiveness | All core pages usable |
| Zero critical bugs | 0 P0 issues |

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Data Ingestion | 1 day | F14/F15 fully synced, currency normalized |
| API Enhancements | 1 day | Aggregates endpoint, ROI integration |
| Dashboard Build | 1 day | ROI analytics page |
| Polish & QA | 1 day | Testing, dark mode, responsive fixes |
| **Total** | **4 days** | Production ready |

---

## Appendix: Deferred Feature Specs

### A. Milestone Scraper (Post-Launch)

**Blocker**: `milestones.projectcatalyst.io` renders client-side; no REST API.

**Options**:
1. Puppeteer/Playwright scraper (fragile, breaks on site updates)
2. Request official API access from IOG
3. Community data contribution workflow

**Recommendation**: Use manual JSON exports until official API available.

---

### B. Category-Specific KPIs (Future)

**Concept**: Different project types need different success metrics.

| Category | KPIs |
|----------|------|
| YouTube Content | Views, watch time, subscribers gained |
| Events | Attendance, repeat rate, feedback scores |
| DeFi | TVL, transaction count, unique users |
| Education | Completions, quiz scores, certificates |

**Blocker**: Each requires different data source integration and API keys.

**Recommendation**: Ship with current ROI (GitHub/Deliverables/OnChain) and add category-specific KPIs incrementally.

---

### C. NER Organization Extraction (Future)

**Concept**: Automatically detect organization mentions in proposal text.

**Example**: "Built by Acme Corp in partnership with XYZ Labs" → Link to org entities.

**Blocker**: 
- Requires NLP model (spaCy, Hugging Face)
- High false positive rate without training data
- Org names are often informal or abbreviated

**Recommendation**: Manual org linking via admin UI; crowdsource corrections.

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-15 | Initial PRD created from Grok feedback analysis | Cascade |
