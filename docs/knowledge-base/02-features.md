# PROOF Knowledge Base - Features Overview

---

## Public Features (No Login Required)

### Projects Directory (`/projects`)

Browse and search all Catalyst proposals:

- **Search**: Full-text search by title, description, keywords
- **Filter by Fund**: F2 through F14+ 
- **Filter by Status**: Funded, In Progress, Completed, Not Approved
- **Filter by Category**: DeFi, Identity, Governance, Developer Tools, etc.
- **Sort Options**: Funding amount, date, completion rate

### Project Detail Pages (`/projects/[id]`)

Comprehensive view of any proposal:

| Section | Information |
|---------|-------------|
| **Header** | Title, status badge, funding amount, fund name |
| **Description** | Problem, solution, experience, challenge |
| **Milestones** | Timeline with SoM/PoA status for each |
| **Team** | All people with roles and accountability badges |
| **Voting Results** | Yes/no/abstain votes, approval rate, rank in fund |
| **GitHub Activity** | Stars, forks, commits, contributor count |
| **On-chain Activity** | Transaction count, ADA received |
| **External Links** | GitHub, website, social media, documentation |
| **Community Reviews** | User-submitted reviews with ratings |
| **Flags** | Any automated or community flags |
| **Concerns** | Reported issues and team responses |

### People Profiles (`/people/[id]`)

Individual proposer/team member pages:

- **All Projects**: Every project they've been involved with
- **Accountability Score**: Overall score with breakdown
- **Accountability Badge**: TRUSTED, RELIABLE, UNPROVEN, or CONCERNING
- **Delivery History**: Completion rate, on-time rate
- **Aliases**: Known alternate names (from identity resolution)
- **Organizations**: Associated companies/teams

### Organization Profiles (`/organizations/[id]`)

Company and team entity pages:

- **Team Members**: All linked people
- **Projects**: All proposals under this organization
- **Aggregate Stats**: Total funding, completion rate
- **Top Categories**: Most common proposal categories
- **GitHub Activity**: Combined activity across repos

### Fund Overview (`/funds/[id]`)

Per-fund statistics:

- **Budget Allocation**: Total budget vs. awarded
- **Proposal Count**: Submitted vs. funded
- **Category Breakdown**: Distribution of funds
- **Completion Rates**: Overall and by category
- **Top Projects**: Highest-funded proposals

### Network Graph (`/graph`)

Interactive visualization:

- **Node Types**: Projects, People, Funds, Organizations
- **Edge Types**: Team membership, funding, organization
- **View Modes**:
  - Default: Standard network layout
  - Centrality: Size by connection count
  - Clusters: Group related entities
  - Funding Flow: Show fund → project → person
- **Filters**: Toggle node types, filter by score, search
- **Interactions**: Click nodes for details, drag to explore

### Rankings (`/rankings`)

Leaderboards:

- **Top Projects**: By funding received, completion rate, ROI
- **Top Contributors**: By project count, total funding, completion
- **Filter by Fund**: Compare across funding rounds
- **Sort Options**: Multiple ranking criteria

### Voting Analytics (`/voting`)

Historical voting data:

- **Trends**: Approval rates over time
- **Category Analysis**: Which categories get funded
- **Voting Patterns**: Yes/no distributions
- **Top Approved**: Highest-voted proposals

### Milestone Dashboard (`/milestones`)

Cross-project milestone view:

- **Status Overview**: Pending, In Progress, Completed, Overdue
- **Filter by Fund**: Focus on specific rounds
- **Filter by Status**: Find overdue or blocked milestones
- **Aggregate Stats**: Overall completion rates

---

## Authenticated Features (Login Required)

### Community Reviews

Write detailed project assessments:

| Field | Description |
|-------|-------------|
| **Rating** | 1-5 stars overall |
| **Title** | Brief summary |
| **Content** | Detailed review text |
| **Alignment Score** | How well aligns with Cardano goals (1-5) |
| **Feasibility Score** | How realistic the plan is (1-5) |
| **Auditability Score** | How verifiable progress is (1-5) |

Reviews are public and can receive helpful/not helpful votes.

### Concerns Submission

Flag specific issues:

| Category | Use Case |
|----------|----------|
| **Delayed Delivery** | Missed milestones or timelines |
| **Communication Issues** | Unresponsive team |
| **Quality Issues** | Deliverables below expectations |
| **Misrepresentation** | Inaccurate claims in proposal |
| **Other** | General concerns |

Include evidence URLs when possible. Project teams can respond directly.

### Bookmarks & Lists

Organize projects:

- **Quick Actions**: Like, Skip, Save
- **Custom Lists**: Create named collections
- **Discovery Feed**: Tinder-style project exploration (`/discover`)

### Project Comparison (`/compare`)

Side-by-side analysis:

- Select 2-4 projects
- Compare funding, milestones, team, ROI
- See scoring breakdowns

---

## Moderator/Admin Features

### Flag Review Queue (`/flags`, `/admin/flags`)

Review automated and community flags:

- **Pending**: Needs review
- **Confirmed**: Valid flag, visible to public
- **Dismissed**: Invalid, hidden
- **Actions**: Confirm, Dismiss, Request Info

### Report Moderation (`/reports`)

Review monthly reports:

- **Approve**: Publish to project page
- **Request Changes**: Send back for edits
- **Reject**: Block publication with reason

### Data Health Dashboard (`/admin/health`)

Monitor data quality:

- **Ingestion Status**: Last sync times
- **Missing Data**: Fields without values
- **Stale Records**: Not updated recently
- **Error Logs**: Failed operations

### Connection Management (`/admin/connections`)

Create verified entity links:

- Link people to projects
- Associate organizations
- Merge duplicate entities

### User Management

- View/edit user roles
- Handle accountability disputes
- Manage banned users
