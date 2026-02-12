# PROOF Database Schema

> Entity relationships and key models for the PROOF transparency platform.

---

## Core Entities

### Fund
Represents a Catalyst funding round (e.g., Fund 10, Fund 11).

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| externalId | String? | Catalyst API ID |
| name | String | Fund name (e.g., "Fund 12") |
| number | Int | Fund number for ordering |
| status | String | active, completed |
| totalBudget | Decimal | Total available budget |
| totalAwarded | Decimal | Total awarded to proposals |
| totalDistributed | Decimal | Total disbursed |
| proposalsCount | Int | Denormalized count |
| fundedProposalsCount | Int | Denormalized count |
| completedProposalsCount | Int | Denormalized count |

### Project
Represents a Catalyst proposal/project.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| externalId | String? | Catalyst API ID |
| fundId | UUID | Foreign key to Fund |
| title | String | Proposal title |
| description | String | Full description |
| category | String | Challenge/category |
| status | String | completed, in_progress, funded, not_approved |
| fundingStatus | String | pending, funded, distributed |
| fundingAmount | Decimal | Requested amount |
| amountReceived | Decimal | Disbursed amount |
| yesVotes | Int | Yes vote count |
| noVotes | Int | No vote count |

### Person
Represents an individual involved in proposals.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| externalId | String? | Catalyst API ID |
| name | String | Display name |
| aliases | String[] | Alternative names (identity resolution) |
| proposalsCount | Int | Denormalized stats |
| fundedProposalsCount | Int | Denormalized stats |
| completedProposalsCount | Int | Denormalized stats |
| totalAmountAwarded | Decimal | Total funding received |

### Organization
Represents a team or company.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Organization name |
| members | PersonOrganization[] | Member relationships |
| projectOrgs | ProjectOrganization[] | Project relationships |

---

## Relationship Entities

### ProjectPerson
Links people to projects with roles.

| Field | Type | Description |
|-------|------|-------------|
| projectId | UUID | Foreign key |
| personId | UUID | Foreign key |
| role | String? | Role on project |
| isPrimary | Boolean | Primary proposer flag |

### ProjectOrganization
Links organizations to projects.

### PersonOrganization
Links people to organizations with roles.

---

## Community Layer

### User
Registered platform users (wallet or email auth).

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| walletAddress | String? | Cardano wallet (CIP-30) |
| email | String? | Email address |
| displayName | String? | Public name |

### Session
User authentication sessions.

| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | Foreign key |
| token | String | Session token |
| expiresAt | DateTime | Expiration time |

### Review
Community reviews of proposals.

| Field | Type | Description |
|-------|------|-------------|
| projectId | UUID | Foreign key |
| userId | UUID | Foreign key |
| rating | Int | 1-5 rating |
| title | String | Review title |
| content | String | Review body |
| alignmentScore | Int? | Optional sub-score |
| feasibilityScore | Int? | Optional sub-score |
| auditabilityScore | Int? | Optional sub-score |
| helpfulCount | Int | Upvotes |
| notHelpfulCount | Int | Downvotes |

### ReviewVote
Votes on review helpfulness.

| Field | Type | Description |
|-------|------|-------------|
| reviewId | UUID | Foreign key |
| userId | UUID | Foreign key |
| value | Int | 1 (helpful) or -1 (not helpful) |

### Rating
Simple star ratings (legacy).

### Concern
Flagged issues on proposals.

### ConcernResponse
Proposer responses to concerns.

---

## Accountability System

### AccountabilityScore
Computed reputation scores for people.

| Field | Type | Description |
|-------|------|-------------|
| personId | UUID | Foreign key (unique) |
| overallScore | Int | 0-100 composite score |
| completionScore | Int | Completion rate (40%) |
| deliveryScore | Int | On-time delivery (20%) |
| communityScore | Int | Community rating (20%) |
| efficiencyScore | Int | Funding efficiency (10%) |
| communicationScore | Int | Report frequency (10%) |
| badge | String | trusted, reliable, unproven, concerning |
| calculatedAt | DateTime | Last calculation time |

### Reputation
User reputation (for reviewers).

### ReputationEvent
Reputation change history.

---

## Voting Data

### VotingRecord
Historical voting data per proposal.

| Field | Type | Description |
|-------|------|-------------|
| projectId | UUID | Foreign key |
| fundId | UUID | Foreign key |
| category | String | Challenge category |
| yesVotes | Int | Yes vote count |
| noVotes | Int | No vote count |
| abstainVotes | Int | Abstain count |
| uniqueWallets | Int | Unique voter count |
| approvalRate | Float | yes / (yes + no) |
| fundingProbability | Float | Likelihood of funding |
| fundRank | Int? | Rank within fund |
| categoryRank | Int? | Rank within category |
| capturedAt | DateTime | Data capture time |

---

## Metrics & Analytics

### Link
External links attached to projects.

| Field | Type | Description |
|-------|------|-------------|
| projectId | UUID | Foreign key |
| url | String | Full URL |
| type | String | github_repo, youtube, twitter, website |
| label | String? | Display label |

### github_repo_metrics
GitHub repository metrics (raw table).

### youtube_metrics
YouTube video/channel metrics (raw table).

### impact_scores
Computed impact scores per project.

---

## Source Provenance

All core entities include:

| Field | Type | Description |
|-------|------|-------------|
| sourceUrl | String | Original data source URL |
| sourceType | String | catalyst_explorer, catalyst_scrape, etc. |
| lastSeenAt | DateTime | Last time data was refreshed |
| createdAt | DateTime | Record creation time |
| updatedAt | DateTime | Last modification time |

---

## Entity Relationship Diagram

```
Fund ─────────────────────┐
  │                       │
  │ 1:N                   │ 1:N
  ▼                       ▼
Project ◄───────── VotingRecord
  │
  │ N:M
  ▼
ProjectPerson ───▶ Person ───▶ AccountabilityScore
  │                   │
  │                   │ N:M
  ▼                   ▼
ProjectOrganization  PersonOrganization ───▶ Organization

User ───┬──▶ Review ───▶ ReviewVote
        │
        ├──▶ Rating
        │
        ├──▶ Concern ───▶ ConcernResponse
        │
        └──▶ Reputation ───▶ ReputationEvent
```

---

**Created:** 2026-02-12  
**Last Updated:** 2026-02-12
