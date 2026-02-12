# Milestone Data Sources Research

**Date:** 2026-02-12  
**Task:** PROOF-050  
**Status:** Completed

---

## Summary

Catalyst milestone tracking transitioned from monthly reporting to the **Milestones Program framework** in January 2024. Data is managed through the official Milestone Module at `milestones.projectcatalyst.io`.

---

## Primary Data Sources

### 1. Catalyst Milestone Module (Official)

**URL:** https://milestones.projectcatalyst.io/

**Description:**  
The official tool for managing funded project milestones. Handles Statement of Milestones (SoM) and Proof of Achievement (PoA) submissions.

**Data Available:**
- Project milestones with outputs and acceptance criteria
- Milestone status (pending, approved, rejected)
- Proof of Achievement submissions
- Reviewer feedback
- Payment status

**API Access:** ❌ No public API  
**Alternative:** Web scraping or official data request

**Milestone Structure:**
```
Milestone
├── Title
├── Expected Outputs
├── Acceptance Criteria
├── Cost (ADA)
├── Due Date
├── Status (pending/approved/rejected/signed_off)
├── Proof of Achievement
│   ├── Evidence URLs
│   └── Description
└── Reviewer Feedback
```

---

### 2. LidoNation Catalyst Explorer API

**URL:** https://www.lidonation.com/api/catalyst-explorer

**Description:**  
Third-party API with comprehensive proposal data. Does not include dedicated milestone endpoints.

**Relevant Fields from `/proposals`:**
- `project_status`: in_progress, completed, etc.
- `amount_requested` / `amount_received`
- `funding_status`

**Milestone Data:** ❌ Not available via API  
**Use Case:** Cross-reference proposal metadata with milestone data

---

### 3. CatalystExplorer.com

**URL:** https://www.catalystexplorer.com/

**Description:**  
Alternative explorer built by LidoNation with milestone visualization.

**Features:**
- Milestone progress visualization per proposal
- Integration with Milestone Module data

**API Access:** Uses same LidoNation API backend

---

## Data Integration Strategy

### Option A: Official Data Request (Recommended)
1. Contact Catalyst team for milestone data export
2. Request periodic data dumps or API access
3. Expected format: JSON/CSV with milestone details

### Option B: Web Scraping
1. Scrape public milestone pages from milestones.projectcatalyst.io
2. Parse SPA JavaScript-rendered content
3. **Risks:** Terms of service, rate limiting, data freshness

### Option C: Hybrid Approach
1. Use LidoNation API for proposal metadata
2. Maintain manual milestone records in our database
3. Allow community to report milestone updates

---

## Recommended Schema Extension

Based on research, our existing `Milestone` model needs these additions:

```prisma
model Milestone {
  // Existing fields...
  
  // New fields for Catalyst integration
  catalystMilestoneId  String?   // ID from Milestone Module
  somStatus            String?   // approved, pending, rejected
  poaStatus            String?   // approved, pending, rejected
  poaSubmittedAt       DateTime?
  poaApprovedAt        DateTime?
  reviewerFeedback     String?
  paymentStatus        String?   // pending, released
  paymentTxHash        String?   // On-chain payment reference
  evidenceUrls         String[]  // URLs submitted as proof
}
```

---

## Next Steps

1. **PROOF-051:** Extend Milestone schema with Catalyst-specific fields
2. **PROOF-052:** Build milestone sync mechanism (manual or automated)
3. **PROOF-053:** Create milestone tracking UI
4. **PROOF-054:** Add milestone status dashboard

---

## References

- [Milestone Module](https://milestones.projectcatalyst.io/)
- [Milestone Module Docs](https://docs.projectcatalyst.io/catalyst-tools/milestone-module)
- [Statement of Milestones Guide](https://docs.projectcatalyst.io/catalyst-tools/milestone-module/statement-of-milestones-som)
- [LidoNation API](https://www.lidonation.com/catalyst-explorer/api)
