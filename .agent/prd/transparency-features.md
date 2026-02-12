# PROOF: Comprehensive Catalyst Transparency Platform

## Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** February 2026  
**Status:** Planning  

---

## Executive Summary

PROOF aims to become the definitive community-centered transparency tool for Project Catalyst, replacing CatalystExplorer with a more robust, open, and accountability-focused platform. This PRD outlines the features required to achieve full transparency for Catalyst funding.

---

## Vision

> Make every ADA of Catalyst funding accountable through community-powered transparency.

---

## Goals

1. **Complete Visibility** — Track every proposal, person, organization, and funding transaction
2. **Community Accountability** — Enable the community to rate, review, and flag proposals
3. **Predictive Trust** — Build reputation scores that help voters make informed decisions
4. **Open Data** — Make all data exportable and API-accessible for researchers
5. **Red Flag Detection** — Automatically identify concerning patterns before funding

---

## Feature Categories

### Phase 1: Community Review System
**Priority:** P0 (Critical)  
**Estimated Effort:** 2-3 weeks  
**Milestone:** 7

#### 1.1 User Authentication
- Wallet-based login (Cardano wallet signature)
- Optional email verification
- Profile creation with display name
  - Verification flow: server issues nonce, wallet signs nonce, server verifies signature against wallet address before creating session

#### 1.2 Proposal Reviews
- Star rating (1-5) for proposals
- Written review with title and body
- Categories: Alignment, Feasibility, Auditability, Value
- Review moderation queue

#### 1.3 Review Voting
- Helpful / Not Helpful voting on reviews
- Reviewer reputation based on helpful votes
- Sort reviews by: newest, most helpful, rating

#### 1.4 Review Analytics
- Average rating per proposal
- Rating distribution visualization
- Top reviewers leaderboard

---

### Phase 2: Accountability Scoring Engine
**Priority:** P0 (Critical)  
**Estimated Effort:** 2 weeks  
**Milestone:** 8

#### 2.1 Person Accountability Score
Computed score (0-100) based on:
- **Completion Rate** (40%): % of funded proposals completed
- **On-Time Delivery** (20%): % of milestones delivered on schedule
- **Community Rating** (20%): Average review score
- **Funding Efficiency** (10%): Actual spend vs requested
- **Communication** (10%): Monthly report frequency

#### 2.2 Organization Accountability Score
Aggregate of team member scores with additional factors:
- Team continuity across proposals
- Cross-proposal success rate
- Open source delivery

#### 2.3 Score Display
- Badge system: Trusted (80+), Reliable (60-79), Unproven (40-59), Concerning (<40)
- Score breakdown tooltip
- Historical score trend

---

### Phase 3: Voting & Tally Data
**Priority:** P1 (High)  
**Estimated Effort:** 2-3 weeks  
**Milestone:** 9

#### 3.1 Vote Import
- Ingest historical voting data from Catalyst archives
- Store: yes_votes, no_votes, abstain_votes, unique_wallets
- Voting power distribution

#### 3.2 Tally Analytics
- Funding probability calculator
- Category/fund rankings
- Approval rates by fund

#### 3.3 Voter Profiles (DReps)
- DRep profiles with voting history
- Delegation tracking
- Voting power over time

---

### Phase 4: Red Flag Detection
**Priority:** P1 (High)  
**Estimated Effort:** 2 weeks  
**Milestone:** 10

#### 4.1 Automated Flags
- **Repeat Delays**: Proposer has >2 incomplete projects
- **Similar Proposals**: Text similarity detection across proposals
- **Funding Clusters**: Same team requesting from multiple funds
- **Milestone Overdue**: >30 days past due
- **Ghost Projects**: No updates in >90 days

#### 4.2 Community Flags
- Users can flag proposals with reason
- Flag categories: Plagiarism, Abandoned, Misuse, Duplicate
- Moderator review queue

#### 4.3 Flag Dashboard
- Public flag statistics
- Flagged proposals list
- Resolution tracking

---

### Phase 5: Milestone Tracking
**Priority:** P1 (High)  
**Estimated Effort:** 2-3 weeks  
**Milestone:** 11

#### 5.1 Milestone Data
- Import milestone data from Catalyst Milestone Module
- Manual milestone entry for proposers
- Proof of Achievement (PoA) links

#### 5.2 Progress Visualization
- Timeline view per proposal
- Gantt chart for multi-milestone projects
- Fund-wide milestone completion stats

#### 5.3 Deadline Alerts
- Public calendar of upcoming deadlines
- Overdue milestone notifications
- Email alerts for tracked proposals

---

### Phase 6: Monthly Reports
**Priority:** P2 (Medium)  
**Estimated Effort:** 1-2 weeks  
**Milestone:** 12

#### 6.1 Report Import
- Ingest monthly reports from proposers
- Link to proposals
- Extract key metrics

#### 6.2 Report Analytics
- Reporting frequency scores
- Content analysis (length, detail)
- Community comments on reports

---

### Phase 7: Communities & Groups
**Priority:** P2 (Medium)  
**Estimated Effort:** 2 weeks  
**Milestone:** 13

#### 7.1 Topic Communities
- User-created communities (e.g., "DeFi", "Education", "Africa")
- Proposal tagging to communities
- Community-specific dashboards

#### 7.2 Organizations/Groups
- Company/team profiles
- Cross-proposal team view
- Organization accountability score

---

### Phase 8: Advanced Analytics
**Priority:** P2 (Medium)  
**Estimated Effort:** 2 weeks  
**Milestone:** 14

#### 8.1 Dashboards
- Fund comparison dashboard
- Category performance charts
- Proposer leaderboards

#### 8.2 Network Analysis
- Enhanced knowledge graph
- Cluster detection
- Influence mapping

#### 8.3 Predictive Analytics
- Funding success predictor
- Completion probability
- Risk assessment

---

### Phase 9: Open Source Verification
**Priority:** P3 (Nice-to-have)  
**Estimated Effort:** 1-2 weeks  
**Milestone:** 15

#### 9.1 GitHub Integration
- Link proposals to repos
- Commit activity tracking
- Contributor verification

#### 9.2 Activity Scoring
- Code frequency metrics
- Issue resolution rates
- Release tracking

---

### Phase 10: Completion NFTs
**Priority:** P3 (Nice-to-have)  
**Estimated Effort:** 2 weeks  
**Milestone:** 16

#### 10.1 NFT Minting
- On-chain proof of project completion
- Community-verified completion
- Proposer wallet verification

---

### Phase 11: AI-Powered Discovery
**Priority:** P1 (High)  
**Estimated Effort:** 3-4 weeks  
**Milestone:** 17

#### 11.1 Proposal Comparison
- AI-powered side-by-side comparison of proposals
- Highlight similarities and differences
- Identify overlapping scope or duplicate efforts

#### 11.2 Natural Language Search
- Ask questions about proposals in any fund
- "Find proposals about DeFi in Africa"
- "What proposals have been funded for education?"
- Cross-fund knowledge discovery

#### 11.3 Recommendation Engine
- Learn voter preferences from interactions
- Suggest proposals based on voting history
- Personalized proposal feed

---

### Phase 12: Proposal Discovery UI ("Proposal Tinder")
**Priority:** P1 (High)  
**Estimated Effort:** 2 weeks  
**Milestone:** 18

#### 12.1 Swipe Interface
- Card-based proposal presentation
- Swipe right to bookmark, left to skip
- Quick view of key proposal info

#### 12.2 Bookmarks & Shortlists
- Save interesting proposals
- Create named lists for different voting rounds
- Export bookmark lists

#### 12.3 Smart Ordering
- AI-powered ordering based on preferences
- Filter by category, fund, status
- "More like this" discovery

---

### Phase 13: On-Chain Funding Transactions
**Priority:** P0 (Critical)  
**Estimated Effort:** 3 weeks  
**Milestone:** 19

#### 13.1 Transaction Tracking
- Ingest mainnet funding distribution transactions
- Link transactions to proposals
- Track: date, amount (ADA), destination address
- Historical data back to Fund 2

#### 13.2 Transaction Explorer
- View transaction details per proposal
- Link to external explorers (CardanoScan, Cexplorer)
- USD conversion at time of transaction
- Real-time ADA/USD rates

#### 13.3 Team Address Tagging
- Proposers can claim/tag their wallet addresses
- Verify ownership via signature
- Track multiple addresses per team
- Enhanced transparency for fund flow

#### 13.4 Funding Analytics
- Total distributed per fund
- Distribution timeline charts
- Address clustering analysis
- Fund flow visualization

---

### Phase 14: OpenAPI V3 Specification
**Priority:** P1 (High)  
**Estimated Effort:** 1-2 weeks  
**Milestone:** 20

#### 14.1 API Documentation
- OpenAPI 3.0 compliant specification
- Interactive API documentation (Swagger UI)
- Code generation support
- Versioned endpoints

#### 14.2 Developer Experience
- Authentication documentation
- Rate limiting guidelines
- Webhook support for updates
- SDK generation for popular languages

---

### Phase 15: Reviewer & Moderator Profiles
**Priority:** P1 (High)  
**Estimated Effort:** 2 weeks  
**Milestone:** 21

#### 15.1 Reviewer Profiles
- Community reviewers can claim profiles
- Review history across funds
- Review outcomes (approved/rejected)
- Reviewer reputation score

#### 15.2 Moderator Profiles
- Moderator participation history
- Moderation statistics
- Fund/category assignments

#### 15.3 Profile Verification
- Link to Ideascale account
- Wallet-based verification
- Badge for verified reviewers/moderators

---

## Data Sources

| Source | Data | Access |
|--------|------|--------|
| CatalystExplorer API | Proposals, Funds, Teams | Public |
| Catalyst Gateway | Raw proposal documents | Public (CBOR) |
| Catalyst Milestone Supabase | Milestones, PoAs | Requires API Key |
| Jörmungandr Voting Archive | Historical votes | Public |
| GitHub API | Repo activity | Public |
| User Input | Reviews, Flags | Generated |
| Cardano Mainnet | Funding transactions | Public (via indexer) |
| Exchange APIs | ADA/USD rates | Public |

---

## Technical Architecture

### Database Schema Extensions

```prisma
model User {
  id            String    @id @default(uuid())
  walletAddress String?   @unique
  email         String?   @unique
  displayName   String?
  createdAt     DateTime  @default(now())
  reviews       Review[]
  flags         Flag[]
  votes         ReviewVote[]
}

model Review {
  id            String    @id @default(uuid())
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  rating        Int       // 1-5
  title         String
  content       String
  alignmentScore    Int?
  feasibilityScore  Int?
  auditabilityScore Int?
  helpfulCount  Int       @default(0)
  notHelpfulCount Int     @default(0)
  status        String    @default("published")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  votes         ReviewVote[]
}

model ReviewVote {
  id        String   @id @default(uuid())
  reviewId  String
  review    Review   @relation(fields: [reviewId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  value     Int      // 1 = helpful, -1 = not helpful
  createdAt DateTime @default(now())
  @@unique([reviewId, userId])
}

model Flag {
  id        String   @id @default(uuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  type      String   // automated | community
  category  String   // repeat_delays | similar | abandoned | plagiarism
  reason    String?
  status    String   @default("pending")
  createdAt DateTime @default(now())
  resolvedAt DateTime?
}

model AccountabilityScore {
  id                String   @id @default(uuid())
  personId          String   @unique
  person            Person   @relation(fields: [personId], references: [id])
  overallScore      Int
  completionScore   Int
  deliveryScore     Int
  communityScore    Int
  efficiencyScore   Int
  communicationScore Int
  badge             String   // trusted | reliable | unproven | concerning
  calculatedAt      DateTime @default(now())
}

model VotingRecord {
  id              String   @id @default(uuid())
  projectId       String
  project         Project  @relation(fields: [projectId], references: [id])
  fundId          String
  yesVotes        BigInt
  noVotes         BigInt
  abstainVotes    BigInt?
  uniqueWallets   Int?
  votingPower     BigInt?
  categoryRank    Int?
  fundRank        Int?
  approvalChance  Float?
  fundingChance   Float?
  createdAt       DateTime @default(now())
}

model Milestone {
  id            String    @id @default(uuid())
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])
  title         String
  description   String?
  dueDate       DateTime?
  completedAt   DateTime?
  status        String    @default("pending")
  proofUrl      String?
  budget        Decimal?
  disbursed     Decimal?
  createdAt     DateTime  @default(now())
}

model MonthlyReport {
  id            String    @id @default(uuid())
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])
  title         String
  content       String
  reportDate    DateTime
  createdAt     DateTime  @default(now())
}

model Community {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  createdBy   String?
  projects    CommunityProject[]
  createdAt   DateTime  @default(now())
}

model CommunityProject {
  communityId String
  community   Community @relation(fields: [communityId], references: [id])
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
  @@id([communityId, projectId])
}
```

---

## API Endpoints

### Reviews
- `GET /api/reviews?projectId=X` — List reviews for project
- `POST /api/reviews` — Create review (auth required)
- `POST /api/reviews/:id/vote` — Vote on review

### Flags
- `GET /api/flags?projectId=X` — List flags for project
- `POST /api/flags` — Create flag
- `GET /api/flags/stats` — Flag statistics

### Accountability
- `GET /api/accountability/person/:id` — Get person score
- `GET /api/accountability/leaderboard` — Top/bottom scores

### Voting
- `GET /api/voting/:projectId` — Get voting data
- `GET /api/voting/stats?fundId=X` — Fund voting stats

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Active reviewers | 500+ monthly |
| Reviews per funded proposal | >3 average |
| Red flags detected before funding | 90% |
| Data completeness | 100% proposals tracked |
| API uptime | 99.9% |

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Reviews | 2-3 weeks | Auth system |
| Phase 2: Accountability | 2 weeks | Reviews, completion data |
| Phase 3: Voting | 2-3 weeks | Vote data source |
| Phase 4: Red Flags | 2 weeks | NLP/similarity engine |
| Phase 5: Milestones | 2-3 weeks | Milestone API access |
| Phase 6: Reports | 1-2 weeks | Report data source |
| Phase 7: Communities | 2 weeks | - |
| Phase 8: Analytics | 2 weeks | All data ingested |
| Phase 9: GitHub | 1-2 weeks | GitHub API |
| Phase 10: NFTs | 2 weeks | Cardano integration |
| Phase 11: AI Discovery | 3-4 weeks | LLM infrastructure |
| Phase 12: Proposal Tinder | 2 weeks | Bookmarks system |
| Phase 13: On-Chain Txs | 3 weeks | Cardano indexer |
| Phase 14: OpenAPI | 1-2 weeks | All APIs stable |
| Phase 15: Reviewer Profiles | 2 weeks | Profile system |

**Total Estimated Timeline:** 28-36 weeks (7-9 months)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Milestone API requires key | High | Request access or scrape public data |
| Vote data incomplete | Medium | Archive historical data, document gaps |
| Review spam | Medium | Rate limiting, wallet verification |
| Legal concerns | Low | Clear terms of service, data sourcing transparency |

---

## Open Questions

1. Should accountability scores be public or opt-in?
2. How to handle disputed reviews/flags?
3. Integration with official Catalyst voting app?
4. Governance for community moderation?

---

## Appendix: CatalystExplorer Feature Parity

Features from CatalystExplorer to include:
- [x] Proposal listing & search
- [x] Fund overview
- [x] People profiles
- [x] Knowledge graph
- [x] Data export
- [ ] Community reviews (Phase 1)
- [ ] DRep profiles (Phase 3)
- [ ] Voting history (Phase 3)
- [ ] Monthly reports (Phase 6)
- [ ] Communities (Phase 7)
- [ ] Completion NFTs (Phase 10)
- [ ] AI Proposal Comparison (Phase 11)
- [ ] AI Natural Language Search (Phase 11)
- [ ] AI Recommendation Engine (Phase 11)
- [ ] Proposal Tinder/Swipe UI (Phase 12)
- [ ] Bookmarks/Shortlists (Phase 12)
- [ ] On-Chain Funding Transactions (Phase 13)
- [ ] USD Conversions (Phase 13)
- [ ] Team Address Tagging (Phase 13)
- [ ] OpenAPI V3 Spec (Phase 14)
- [ ] Reviewer Profiles (Phase 15)
- [ ] Moderator Profiles (Phase 15)
