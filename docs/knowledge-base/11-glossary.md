# PROOF Knowledge Base - Glossary

> Definitions of key terms used throughout the platform

---

## A

### Accountability Score
A numerical rating (0-100) assigned to individuals based on their history of delivering on Catalyst proposals. Combines completion rate, delivery timeliness, community feedback, efficiency, and communication metrics.

### ADA
The native cryptocurrency of the Cardano blockchain. Used for transactions, staking, and Catalyst funding disbursements (Fund 10+).

### Alias
An alternative name associated with a person. Identity resolution may detect that "John Smith" and "J. Smith" refer to the same individual, storing one as an alias.

### App Router
Next.js 13+ routing system using file-system based routing in the `app/` directory. PROOF uses App Router for all pages.

### Auditability Score
A sub-component of reviews measuring how verifiable a project's progress is (1-5 scale).

---

## B

### Badge
Visual indicator of accountability level: TRUSTED (green), RELIABLE (blue), UNPROVEN (yellow), CONCERNING (red).

### Blockfrost
A third-party API service for querying the Cardano blockchain. PROOF uses it to fetch on-chain transaction data.

### Bookmark
A saved reference to a project for later viewing. Users can organize bookmarks into custom lists.

---

## C

### Cardano
A proof-of-stake blockchain platform. Project Catalyst is Cardano's treasury and governance system.

### Catalyst Explorer
Third-party platform (catalystexplorer.com) providing API access to Catalyst proposal data.

### Category
The thematic classification of a Catalyst proposal (e.g., DeFi, Governance, Developer Tools, Identity).

### Challenge
In Catalyst, a specific problem statement or focus area that proposals can address within a fund.

### CIP-30
Cardano Improvement Proposal defining the standard for wallet-to-dApp communication. Used for wallet-based authentication.

### Claim (Project)
The process by which a proposer verifies ownership of a project on PROOF to enable management features.

### Completion Rate
The percentage of projects an individual has completed out of all projects they've participated in.

### Concern
A user-submitted issue about a specific project. More targeted than a review, requiring categorization and evidence.

### Confidence Level
A measure (0-1) of how reliable a calculated score is, based on available data quantity and quality.

### Cytoscape.js
JavaScript graph visualization library used for the network graph feature.

---

## D

### Deliverable
A concrete output or artifact produced by a project, often as part of a milestone.

### Dispute
A formal challenge to an accountability score or flag, requiring moderator review.

### DOGE View
Informal name for PROOF's transparency interface, inspired by government spending transparency initiatives.

---

## E

### ETL
Extract, Transform, Load - the process of collecting data from sources, processing it, and storing it in the database.

### External ID
An identifier from the original data source (e.g., Catalyst Explorer ID), preserved for reference and deduplication.

---

## F

### Feasibility Score
A sub-component of reviews measuring how realistic a project's plan is (1-5 scale).

### Flag
A warning indicator on a project or person. Can be automated (system-detected patterns) or community (user-submitted).

### Fund
A Catalyst funding round (e.g., Fund 10, Fund 14). Each fund has its own budget, proposals, and timeline.

### Funding Amount
The amount of money (USD or ADA) awarded to a funded proposal.

---

## G

### GitHub Score
Component of ROI calculation measuring a project's GitHub activity (stars, forks, commits, contributors).

### Graph
The network visualization showing relationships between projects, people, funds, and organizations.

---

## H

### Helpful Vote
User feedback indicating a review was useful. Contributes to review visibility and author reputation.

---

## I

### Identity Resolution
The process of determining that different name variations refer to the same person or organization. Uses fuzzy string matching.

### Impact Alignment
A review sub-score measuring how well a project aligns with Cardano's mission (1-5 scale).

### Ingestion
The process of importing data from external sources into the PROOF database.

---

## L

### lastSeenAt
Timestamp indicating when a piece of data was last verified from its source.

---

## M

### Magic Link
Passwordless authentication method where users receive a login link via email.

### Member
Base authenticated user role. Can write reviews, submit concerns, and bookmark projects.

### Milestone
A defined checkpoint in a project's roadmap with specific deliverables and timeline.

### Moderator
User role with access to flag review, report moderation, and content management tools.

### Monthly Report
A progress update submitted by project proposers, reviewed by moderators before publication.

---

## N

### Node
In the network graph, a visual element representing an entity (project, person, fund, or organization).

### Normalization
The process of standardizing data formats (e.g., converting names to lowercase for comparison).

---

## O

### OAuth
Authentication protocol allowing sign-in via third-party providers (Google).

### On-chain
Activity recorded on the Cardano blockchain, as opposed to off-chain data.

### On-chain Score
Component of ROI calculation measuring blockchain activity (transactions, addresses, volume).

### Organization
A company, DAO, or group entity associated with Catalyst proposals.

### Outcome Score
Aggregate measure (0-100) combining GitHub, deliverable, and on-chain scores.

---

## P

### Person
An individual associated with Catalyst proposals as proposer or team member.

### PoA (Proof of Achievement)
Evidence submitted to verify milestone completion. Part of Catalyst's accountability process.

### Prisma
Database ORM (Object-Relational Mapping) used by PROOF to interact with PostgreSQL.

### Project
A Catalyst proposal that has been submitted for funding.

### Proposer
The primary submitter of a Catalyst proposal. Has special management rights for their projects on PROOF.

---

## R

### Rating
Numerical assessment (typically 1-5 stars) given to a project in a review.

### Reputation
A user's accumulated credibility score based on contribution quality.

### Review
A detailed assessment of a project submitted by a community member.

### Reviewer
Enhanced user role with access to review templates and specialized tools.

### ROI (Return on Investment)
Score measuring outcome value relative to funding received. Higher = better value per dollar.

---

## S

### Session
A temporary authenticated state allowing a user to remain logged in.

### Severity
Flag intensity level: Low, Medium, High, or Critical.

### Slug
URL-friendly version of a project title (e.g., "my-awesome-project").

### SoM (Statement of Milestone)
A formal description of what will be delivered in a milestone.

### Source Provenance
Metadata tracking where each piece of data came from (source_url, source_type, last_seen_at).

### Stale
Data that hasn't been updated recently and may not reflect current state.

### Supabase
Backend-as-a-Service platform providing PostgreSQL database hosting for PROOF.

---

## T

### TanStack Query
React data fetching library (formerly React Query) used for caching and synchronization.

### Threshold
A cutoff value for algorithmic decisions (e.g., 86% similarity for identity matching).

### TRUSTED
Highest accountability badge (score 80-100), indicating consistent delivery.

---

## U

### UNPROVEN
Accountability badge for individuals with limited track record (score 40-59).

### Upsert
Database operation that inserts a new record or updates an existing one if it already exists.

---

## V

### Verification
The process of confirming ownership or identity (wallet signature, email confirmation).

### Voting Record
Historical data about votes cast on a Catalyst proposal.

---

## W

### Wallet
A Cardano cryptocurrency wallet. Can be used for authentication via CIP-30 signature.

### Weight
The relative importance of a scoring component (e.g., GitHub has 40% weight in ROI).

---

## Acronyms

| Acronym | Meaning |
|---------|---------|
| **ADA** | Cardano's native cryptocurrency |
| **API** | Application Programming Interface |
| **CIP** | Cardano Improvement Proposal |
| **DOGE** | (In this context) Department of Government Efficiency - inspiration for transparency |
| **ETL** | Extract, Transform, Load |
| **MVP** | Minimum Viable Product |
| **ORM** | Object-Relational Mapping |
| **PoA** | Proof of Achievement |
| **PRD** | Product Requirements Document |
| **PROOF** | Public Registry of Outcomes & On-chain Funding |
| **ROI** | Return on Investment |
| **SoM** | Statement of Milestone |
| **UI** | User Interface |
| **URL** | Uniform Resource Locator |
| **UUID** | Universally Unique Identifier |
