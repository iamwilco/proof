# PROOF Phase 2: UX Overhaul, Authentication & ROI Engine

**Version:** 1.0  
**Date:** February 2026  
**Status:** Active  

---

## Executive Summary

Phase 2 transforms PROOF from a data platform into an intuitive accountability tool that serves different user roles with tailored experiences. The focus is on **usability**, **accuracy**, and **transparency** — making it effortless for anyone to trace connections between projects, people, and organizations, identify trustworthy builders, and understand the real ROI of Catalyst funding.

---

## Vision

> Make it trivially easy for anyone to see who delivers and who doesn't — with data, not opinions.

---

## Strategic Goals

| Goal | Description |
|------|-------------|
| **Usability** | Reduce cognitive load; surface the most relevant info first |
| **Accuracy** | Verified data with clear confidence levels |
| **Transparency** | Every number traceable to its source |
| **Accountability** | Automated detection of good builders vs concerning patterns |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary Auth | **Cardano Wallet** | Native to ecosystem, others as fallback |
| Initial Metrics | **GitHub + On-chain only** | Most reliable, social signals in Phase 3 |
| Score Visibility | **Preview period** | Proposers can dispute before public |
| Platform Priority | **Web-first** | Mobile experience in Phase 3 |
| Data Gaps | **Admin connection management** | Manual linking when data incomplete |

---

## Key Differentiators vs CatalystExplorer

| CatalystExplorer | PROOF |
|------------------|-------|
| Single user experience | Role-based adaptive UI |
| Profile claims via Ideascale | Multi-provider auth (Wallet primary, Google, Email) |
| Proposal Tinder for discovery | Proposal Tinder + accountability overlays |
| On-chain funding data | On-chain + automated ROI scoring |
| Community reviews | Structured accountability scoring + red flag detection |
| Knowledge graph | Enhanced graph with grifter/builder clustering |
| No feature voting | Community feature voting system |

---

## Phase 2 Milestones

### Milestone 22: Design System & Navigation Overhaul
**Duration:** 2 weeks  
**Priority:** P0

#### 22.1 Design System Foundation
- Standardized component library (buttons, cards, badges, forms)
- Consistent spacing, typography, color palette
- Dark mode support
- Responsive breakpoints (desktop-first, tablet, mobile-aware)
- Loading states and skeleton screens

#### 22.2 Role-Based Navigation Architecture
Four primary user personas with tailored views:

| Role | Primary Needs | Default View |
|------|---------------|--------------|
| **Voter** | Discover proposals, compare, decide | Discover → Proposal Tinder |
| **Researcher** | Analyze trends, export data, deep dive | Analytics Dashboard |
| **Proposer** | Track own projects, respond to feedback | My Projects |
| **Community Member** | Follow builders, review, flag | People → Following |

#### 22.3 Information Architecture

```
/                       → Landing (public)
├── /discover           → Proposal Tinder (public, enhanced if logged in)
├── /explore            → Browse all (public)
│   ├── /projects       → Projects directory
│   ├── /people         → People directory  
│   ├── /organizations  → Organizations directory
│   └── /funds          → Funds overview
├── /analytics          → Dashboards (public, export requires login)
│   ├── /rankings       → Leaderboards
│   ├── /flags          → Red flag dashboard
│   └── /compare        → Fund comparison
├── /connect            → Knowledge graph (public)
├── /roadmap            → Feature roadmap & voting (public, vote requires login)
├── /my                 → User dashboard (auth required)
│   ├── /bookmarks      → Saved proposals
│   ├── /projects       → My proposals (if proposer)
│   ├── /following      → People/orgs I follow
│   ├── /reviews        → My reviews
│   └── /settings       → Profile settings
└── /admin              → Admin panel (admin role)
    ├── /connections    → Manual connection management
    ├── /flags          → Flag moderation queue
    └── /scores         → Score preview management
```

#### 22.4 Progressive Disclosure
- Public users see core data
- Logged-in users get personalization (bookmarks, follows, notifications)
- Verified proposers can respond to feedback
- Admins see moderation tools + connection management

---

### Milestone 23: Authentication System
**Duration:** 2 weeks  
**Priority:** P0

#### 23.1 Multi-Provider Authentication

| Provider | Implementation | Priority | Use Case |
|----------|---------------|----------|----------|
| **Cardano Wallet** | CIP-30 signature verification | **Primary** | Proposers, voters |
| **Google OAuth** | NextAuth.js provider | Secondary | Quick access |
| **Email Magic Link** | NextAuth.js email provider | Fallback | No wallet users |

#### 23.2 Wallet Authentication Flow
```
1. User clicks "Connect Wallet"
2. Browser wallet popup (Nami, Eternl, Lace, etc.)
3. Server generates random nonce
4. User signs nonce with wallet
5. Server verifies signature matches stake address
6. Session created, linked to User record
```

#### 23.3 Profile System

**User Model:**
```prisma
model User {
  id              String   @id @default(uuid())
  walletAddress   String?  @unique  // stake1...
  email           String?  @unique
  googleId        String?  @unique
  displayName     String?
  avatarUrl       String?
  bio             String?
  role            UserRole @default(MEMBER)
  // Claimed profiles
  claimedPerson   Person?  @relation("ClaimedBy")
  claimedOrg      Organization? @relation("ClaimedBy")
  // Activity
  reviews         Review[]
  flags           Flag[]
  bookmarks       Bookmark[]
  following       Follow[]
  featureVotes    FeatureVote[]
  createdAt       DateTime @default(now())
}

enum UserRole {
  MEMBER
  PROPOSER
  REVIEWER
  MODERATOR
  ADMIN
}
```

#### 23.4 Profile Claiming Workflow
1. User authenticates (wallet preferred)
2. Search for their Person/Organization profile
3. Submit claim with evidence (Ideascale link, wallet proof)
4. Admin reviews and approves
5. User becomes PROPOSER role, can respond to feedback

---

### Milestone 24: Admin Connection Management
**Duration:** 1 week  
**Priority:** P0

#### 24.1 Manual Connection System
Admin can create connections when data sources are incomplete:

**Connection Types:**
- Person ↔ Organization (employment/membership)
- Person ↔ Project (team member, advisor, etc.)
- Organization ↔ Project (team, partner, etc.)
- Person ↔ Person (co-founder, partner, etc.)

**AdminConnection Model:**
```prisma
model AdminConnection {
  id              String   @id @default(uuid())
  sourceType      EntityType
  sourceId        String
  targetType      EntityType
  targetId        String
  connectionType  ConnectionType
  evidence        String?  // URL or description
  notes           String?
  createdBy       User     @relation(fields: [createdById], references: [id])
  createdById     String
  createdAt       DateTime @default(now())
  
  @@unique([sourceType, sourceId, targetType, targetId, connectionType])
}

enum EntityType {
  PERSON
  ORGANIZATION
  PROJECT
}

enum ConnectionType {
  TEAM_MEMBER
  FOUNDER
  ADVISOR
  EMPLOYEE
  PARTNER
  CONTRACTOR
  INVESTOR
  OTHER
}
```

#### 24.2 Admin UI
- Search for entities (people, orgs, projects)
- Create/edit/delete connections
- Add evidence links and notes
- Audit log of all connection changes

#### 24.3 Connection Display
- Admin connections shown with "manual" badge
- Different visual treatment from data-sourced connections
- Hover shows evidence/notes

---

### Milestone 25: Enhanced Discovery UX
**Duration:** 2 weeks  
**Priority:** P0

#### 25.1 Proposal Tinder 2.0
Current implementation exists; enhance with:

- **Accountability overlay**: Show proposer's track record on each card
- **Smart ordering**: AI-powered based on user preferences + proposal quality signals
- **Quick stats**: Completion rate, on-time delivery, community sentiment
- **Red flag badges**: Visual indicators for concerning patterns
- **Keyboard shortcuts**: Arrow keys, space to bookmark

#### 25.2 Connection Explorer
Make relationships instantly visible:

- **Hover cards**: Quick preview of person/org with key stats
- **One-click graph**: "Show connections" button on any entity
- **Relationship types**: Proposer, Team Member, Advisor, Voter, etc.
- **Shared proposals**: "Also worked on: [Project A], [Project B]"
- **Admin connections**: Integrated with manual connections

#### 25.3 Search Improvements
- **Natural language search**: "proposals about DeFi in Africa"
- **Faceted filters**: Fund, Category, Status, Accountability Score, Flags
- **Saved searches**: For logged-in users
- **Search history**: Recent searches dropdown

---

### Milestone 26: Feature Roadmap & Voting
**Duration:** 1 week  
**Priority:** P1

#### 26.1 Roadmap Page
Public page showing:
- **Coming Soon**: Features in active development
- **Planned**: Features on the roadmap
- **Considering**: Ideas being evaluated
- **Shipped**: Recently released features

#### 26.2 Feature Voting System
```prisma
model Feature {
  id              String   @id @default(uuid())
  title           String
  description     String
  status          FeatureStatus @default(CONSIDERING)
  category        String
  votes           FeatureVote[]
  createdAt       DateTime @default(now())
  releasedAt      DateTime?
}

model FeatureVote {
  id              String   @id @default(uuid())
  feature         Feature  @relation(fields: [featureId], references: [id])
  featureId       String
  user            User     @relation(fields: [userId], references: [id])
  userId          String
  createdAt       DateTime @default(now())
  
  @@unique([featureId, userId])
}

enum FeatureStatus {
  CONSIDERING
  PLANNED
  IN_PROGRESS
  SHIPPED
}
```

#### 26.3 Feature Submission
- Logged-in users can submit feature ideas
- Admin reviews and adds to roadmap
- Users notified when their suggestion is shipped

---

### Milestone 27: Accountability Scoring Engine
**Duration:** 3 weeks  
**Priority:** P0

#### 27.1 Person Accountability Score (0-100)

| Factor | Weight | Calculation |
|--------|--------|-------------|
| **Completion Rate** | 35% | Completed / Total Funded proposals |
| **On-Time Delivery** | 20% | Milestones delivered ≤ due date |
| **Milestone Quality** | 15% | PoA accepted on first submission |
| **Communication** | 15% | Monthly reports submitted regularly |
| **Community Rating** | 10% | Average review score |
| **Response Rate** | 5% | Responses to concerns/flags |

**Badge System:**
- 🏆 **Trusted** (80-100): Excellent track record
- ✅ **Reliable** (60-79): Good standing
- ⚪ **Unproven** (40-59): New or limited history
- ⚠️ **Concerning** (<40): Multiple issues detected

#### 27.2 Organization Accountability Score
Aggregate of team member scores with modifiers:
- +10 if team has >3 completed projects
- +5 if team composition consistent across proposals
- -10 if key team members changed mid-project
- -15 if any team member has Concerning badge

#### 27.3 Score Preview Period
**Workflow:**
1. Score calculated and saved with `previewUntil` timestamp
2. Proposer notified via email/notification
3. 14-day preview period to review and dispute
4. Proposer can submit evidence for reconsideration
5. Admin reviews disputes, adjusts if warranted
6. Score goes public after preview period

#### 27.4 Score Transparency
Every score shows:
- Calculation breakdown (expandable)
- Data sources and timestamps
- Confidence level (Low/Medium/High based on data completeness)
- Historical trend (improving/stable/declining)

---

### Milestone 28: Automated ROI & Outcome Rating
**Duration:** 4 weeks  
**Priority:** P1

#### 28.1 Outcome Classification

| Category | Definition | Metrics |
|----------|------------|---------|
| **Impact Delivered** | Tangible product/service live | GitHub activity, user counts, tx volume |
| **Community Built** | Active user/developer community | Contributors, issues, PRs |
| **Knowledge Created** | Research, documentation, education | Repo docs, wiki pages |
| **Infrastructure Provided** | Tools/services used by others | Forks, dependents |
| **No Measurable Outcome** | Nothing verifiable produced | Red flag |

#### 28.2 Automated Outcome Detection (Phase 2 Scope)

**Data Sources (GitHub + On-chain only):**
- **GitHub**: Commits, stars, forks, contributors, issues closed, PRs merged
- **On-chain**: Contract deployments, transaction counts, unique addresses

**Coming Soon (Phase 3):**
- Web: Domain active, Lighthouse scores, traffic estimates
- Social: Twitter/X followers, Discord members, YouTube views

**Scoring Algorithm:**
```
outcome_score = (
  github_activity * 0.4 +
  deliverables_verified * 0.3 +
  on_chain_presence * 0.3
)
```

#### 28.3 ROI Calculation

**Simple ROI:**
```
roi_score = outcome_score / funding_received_usd * normalization_factor
```

**Comparative ROI (within category):**
```
percentile_rank = rank(roi_score, same_category_projects)
```

#### 28.4 ROI Dashboard
- Fund-level ROI comparison
- Category ROI benchmarks
- Top/bottom performers per fund
- Time-to-delivery analysis

---

### Milestone 29: Red Flag Detection System
**Duration:** 2 weeks  
**Priority:** P1

#### 29.1 Automated Red Flags

| Flag Type | Trigger | Severity |
|-----------|---------|----------|
| **Repeat Incomplete** | >2 incomplete funded proposals | High |
| **Ghost Project** | No updates >90 days | High |
| **Milestone Overdue** | >30 days past due | Medium |
| **Team Exodus** | Key members left mid-project | Medium |
| **Duplicate Effort** | >70% text similarity to another proposal | Medium |
| **Funding Cluster** | Same team requesting >$500K across funds | Low |
| **No Deliverables** | Completed status but no PoA | High |

#### 29.2 Community Flags
- Report reasons: Plagiarism, Abandoned, Misuse, Quality, Other
- Evidence upload required
- Anonymous reporting with abuse prevention
- Moderator review queue

#### 29.3 Flag Resolution
- Proposer can respond publicly
- Moderator can: Dismiss, Confirm, Request More Info
- Confirmed flags affect Accountability Score
- All actions logged to audit trail

---

### Milestone 30: Enhanced Knowledge Graph
**Duration:** 2 weeks  
**Priority:** P1

#### 30.1 Graph Improvements
- **Performance**: Virtual scrolling for large graphs
- **Clustering**: Auto-group related entities
- **Filters**: Show/hide by entity type, score, fund
- **Search within graph**: Highlight matching nodes

#### 30.2 Relationship Insights
- **Collaboration strength**: Frequency of working together
- **Success correlation**: Do teams with X person do better?
- **Network position**: Central connectors vs periphery
- **Risk clusters**: Groups with multiple flagged members

#### 30.3 Builder vs Grifter Visualization
- Color coding by Accountability Score
- Visual grouping of concerning patterns
- "Flight risk" indicators for teams
- Admin connections integrated

---

## User Experience Principles

### 1. Show, Don't Tell
- Numbers with context (percentiles, comparisons)
- Visual indicators (badges, progress bars, trend arrows)
- Inline tooltips explaining calculations

### 2. Progressive Complexity
- Simple view by default
- "Show details" for power users
- Expert mode for researchers

### 3. Neutral Language
- "Low activity" not "abandoned"
- "Concerning pattern detected" not "scam"
- Data speaks for itself

### 4. Web-First (Mobile Phase 3)
- Desktop-optimized experience
- Tablet-friendly layouts
- Mobile awareness (readable, functional)
- Full mobile experience in Phase 3

### 5. Fast & Reliable
- <2s page loads
- Skeleton loading states
- Offline-capable for read operations

---

## Technical Considerations

### Authentication
- NextAuth.js v5 with Prisma adapter
- Custom Cardano wallet provider (CIP-30)
- Session strategy: JWT (for API routes) + Database sessions (for web)

### State Management
- TanStack Query for server state
- Zustand for client state (filters, preferences)
- URL state for shareable views

### Performance
- ISR (Incremental Static Regeneration) for public pages
- Edge caching for API responses
- Database connection pooling
- Lazy loading for heavy components (graphs)

### Data Pipeline
- Daily ETL for external metrics (GitHub, on-chain)
- Real-time for user actions (reviews, flags)
- Weekly recalculation of accountability scores
- 14-day preview period before score publication

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Time to insight** | <30s to understand a proposer's track record | User testing |
| **Discovery efficiency** | 3x more proposals reviewed per session | Analytics |
| **Trust accuracy** | 90% of "Concerning" flagged before funding | Retrospective analysis |
| **User engagement** | 50% of voters create accounts | Conversion tracking |
| **Data accuracy** | 99% of automated scores within 5% of manual audit | Spot checks |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gaming accountability scores | High | Multiple data sources, anomaly detection |
| False positive red flags | High | Require human review, appeal process |
| Wallet UX friction | Medium | Multiple auth options, clear instructions |
| Privacy concerns | Medium | Only public data, opt-in for enhanced profiles |
| Performance at scale | Medium | CDN, caching, database optimization |
| Incomplete data connections | Medium | Admin manual connection tool |

---

## Implementation Priority

### Phase 2A (4 weeks) — Foundation
1. Design system + component library
2. Authentication system (Wallet primary + Google + Email)
3. User profiles and role system
4. Admin connection management

### Phase 2B (4 weeks) — Accountability
5. Accountability scoring engine (with preview period)
6. Red flag detection system
7. Enhanced discovery UX

### Phase 2C (4 weeks) — Intelligence
8. Automated ROI engine (GitHub + on-chain)
9. Enhanced knowledge graph
10. Feature roadmap & voting system

---

## Appendix: CatalystExplorer Feature Comparison

| Feature | CatalystExplorer | PROOF Phase 2 |
|---------|------------------|---------------|
| Proposal Tinder | ✅ | ✅ + accountability overlays |
| Profile claiming | Ideascale only | Wallet + Google + Email |
| On-chain txs | ✅ | ✅ |
| AI comparison | ✅ | Planned for Phase 3 |
| Reviewer profiles | ✅ | ✅ |
| Accountability scores | ❌ | ✅ Automated + preview |
| ROI calculation | ❌ | ✅ Automated |
| Red flag detection | ❌ | ✅ Automated |
| Role-based UX | ❌ | ✅ |
| Multiple auth | ❌ | ✅ |
| Feature voting | ❌ | ✅ |
| Admin connections | ❌ | ✅ |

---

**Created:** 2026-02-13  
**Last Updated:** 2026-02-13  
