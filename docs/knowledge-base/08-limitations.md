# PROOF Knowledge Base - Current Limitations

> Understanding the platform's constraints and known issues

---

## Data Source Limitations

### Milestones API Unavailable

**Issue:** The official `milestones.projectcatalyst.io` does not have a public API.

**Impact:**
- Milestone data requires manual JSON export or scraping
- Updates are not real-time
- Some milestone fields may be incomplete

**Current Workaround:**
- Ingestion script reads from local JSON file
- Data must be manually obtained from the portal
- Updates are periodic, not continuous

**Planned Solution:**
- Implement authenticated scraper
- Establish relationship with IOG for data access
- Cache scraped data with staleness indicators

---

### Rate Limits on External APIs

| API | Limit | Impact |
|-----|-------|--------|
| **GitHub** | 5,000 requests/hour (authenticated) | Large-scale GitHub scans throttled |
| **Blockfrost** | 50,000 requests/day (free tier) | On-chain data limited for large batches |
| **Catalyst Explorer** | Unknown (best effort) | Occasional 429 errors during full ingestion |

**Current Mitigations:**
- Request queuing with exponential backoff
- Caching of API responses
- Incremental updates rather than full refreshes

---

### Historical Data Gaps

**Issue:** Data from early Catalyst funds (F1-F5) is incomplete.

**Missing Information:**
- Some proposal descriptions
- Team member details
- Milestone breakdowns
- Voting records

**Reason:** Early funds had different data formats and less structured reporting.

**Status:** Best-effort ingestion; gaps marked as "data unavailable."

---

## Identity Resolution Limitations

### Fuzzy Matching Accuracy

**Issue:** The identity resolution system uses fuzzy string matching (SequenceMatcher), which has inherent limitations.

**Current Threshold:** 86% similarity for person matching

**Known Issues:**
- **False Positives:** "John Smith" may incorrectly merge with "Jonathan Smith"
- **False Negatives:** Same person using different name formats not matched
- **Organization Ambiguity:** Abbreviated names may not link correctly

**Example Problems:**
```
"J. Smith" vs "John Smith" vs "Johnny Smith"
"EMURGO" vs "Emurgo Inc" vs "Emurgo Corporation"
```

**Current Mitigations:**
- Manual merge capability for admins
- Alias tracking
- Confidence scores displayed

**Planned Improvements:**
- Machine learning-based entity resolution
- Community-assisted identity linking
- Wallet-based identity verification

---

### Dispute Workflow Incomplete

**Issue:** The accountability score dispute process is designed but not fully implemented.

**Current State:**
- Users can submit disputes
- Disputes are logged
- Manual moderator review required

**Missing:**
- Automated evidence verification
- Structured appeal process
- Time-bound resolution requirements

---

## Currency & Funding Limitations

### Multi-Currency Complexity

**Issue:** Catalyst funds have used different currencies over time.

| Funds | Currency |
|-------|----------|
| F2-F9 | USD |
| F10+ | ADA |

**Challenges:**
- Historical comparisons difficult
- Exchange rate at funding time unknown
- Total ecosystem spending unclear

**Current Approach:**
- Store amounts in original currency
- Display with currency indicator
- No cross-currency aggregations

**Planned:**
- Historical exchange rate lookup
- Normalized USD equivalent calculations
- Clearly labeled comparison limitations

---

### Funding Disbursement Tracking

**Issue:** Not all on-chain transactions are reliably linked to projects.

**Challenges:**
- Wallet addresses not always disclosed
- Multi-sig and treasury movements complex
- Payment timing varies

**Current Coverage:**
- Projects with known wallet addresses: ~40%
- Verified on-chain transactions: Limited

---

## Scoring Limitations

### ROI Score Caveats

**Issue:** ROI scoring has inherent limitations in measuring "value."

**What It Measures:**
- GitHub activity (observable)
- Milestone completion (observable)
- On-chain usage (observable)

**What It Cannot Measure:**
- Real-world impact
- User satisfaction
- Innovation value
- Community building
- Indirect ecosystem benefits

**Important:** ROI scores are **relative indicators**, not absolute measures of value.

---

### Accountability Score Limitations

**Confidence Levels:**

| Confidence | Meaning |
|------------|---------|
| **High** (>0.8) | Multiple projects, consistent pattern |
| **Medium** (0.5-0.8) | Some history, reasonable sample |
| **Low** (<0.5) | Limited data, high uncertainty |

**New Proposer Problem:**
- First-time proposers have no history
- Default "UNPROVEN" badge may seem unfair
- No way to establish pre-Catalyst reputation

**Current Mitigation:**
- Display confidence level prominently
- Don't penalize for lack of history
- Allow external credential verification (future)

---

### GitHub Score Biases

**Issue:** Not all valuable projects are GitHub-centric.

**Projects Disadvantaged:**
- Research and documentation projects
- Community/marketing initiatives
- Design and UX projects
- Non-software deliverables

**Current Approach:**
- GitHub weight: 40% of outcome score
- Zero GitHub = zero in that component
- Overall ROI still computed from other factors

**Planned:**
- Alternative activity sources (Notion, Figma, etc.)
- Deliverable-type-specific scoring
- Manual evidence assessment

---

## Technical Limitations

### Browser Compatibility

**Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Known Issues:**
- Network graph performance degrades with >500 nodes
- Some animations laggy on older devices
- Mobile experience limited for graph view

---

### Search Limitations

**Current Search:**
- Title and description full-text search
- Case-insensitive
- No fuzzy matching
- No semantic search

**Cannot Search:**
- Review content
- Concern descriptions
- Historical report content

**Planned:**
- Vector-based semantic search
- Cross-entity search
- Saved search filters

---

### Performance Constraints

| Operation | Limitation |
|-----------|------------|
| **Project Directory** | Pagination required at 100+ results |
| **Network Graph** | Usable up to ~500 nodes |
| **Full Ingestion** | Takes 2-4 hours for all proposals |
| **ROI Recalculation** | ~1 second per project |

---

## Feature Limitations

### No Real-Time Updates

**Issue:** Data is refreshed periodically, not in real-time.

**Refresh Frequencies:**
- Catalyst proposals: Daily
- GitHub metrics: On-demand
- Milestones: Manual
- On-chain: On-demand

**User Expectation:**
- New proposals may not appear immediately
- Milestone updates reflect last sync
- Staleness indicators planned

---

### Limited Mobile Experience

**Current State:**
- Pages render on mobile
- Basic functionality works
- No native app

**Limitations on Mobile:**
- Network graph nearly unusable
- Forms harder to complete
- No offline support

---

### No Notification System

**Current State:**
- Email notifications not implemented
- No in-app notification center
- Users must manually check for updates

**Planned:**
- Email alerts for:
  - Responses to your reviews/concerns
  - New flags on watched projects
  - Monthly digest of changes
- In-app notification feed

---

## Data Quality Issues

### Incomplete Proposal Data

Some proposals have missing fields:
- **Description**: ~5% empty or truncated
- **Team Members**: ~15% missing or incomplete
- **Budget Breakdown**: ~30% not itemized
- **External Links**: ~40% missing or broken

---

### Stale External Links

**Issue:** Project websites, GitHub repos, and social links may become stale.

**Current Detection:**
- No automated link checking
- Manual reports only

**Planned:**
- Periodic link validation
- Broken link flagging
- Archive.org fallback links

---

## Known Bugs

| Issue | Status | Workaround |
|-------|--------|------------|
| Graph occasionally fails to render | Investigating | Refresh page |
| Some accountability scores not calculating | In progress | Manual recalculation |
| Duplicate person entries | Known | Admin merge tool |
| Milestone dates showing UTC offset | Planned fix | None |

---

## Reporting Issues

Found a bug or data issue?

1. **For data errors:** Submit a Concern on the affected project
2. **For bugs:** Contact admin via `/contact`
3. **For feature requests:** Community feedback form

Please include:
- What you expected
- What happened instead
- Steps to reproduce
- Browser/device info
