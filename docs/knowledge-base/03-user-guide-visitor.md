# PROOF User Guide - Public Visitor

> For anyone exploring PROOF without an account

---

## Getting Started

No account is needed to explore project data. Simply visit the site and start browsing.

---

## Discovering Projects

### Step 1: Browse the Directory

1. Navigate to **Projects** in the main navigation
2. You'll see a grid/list of all Catalyst proposals

### Step 2: Use Filters

| Filter | Options |
|--------|---------|
| **Fund** | F2, F3, ... F14, F15 (select specific round) |
| **Status** | Funded, In Progress, Completed, Not Approved |
| **Category** | DeFi, Identity, Governance, Developer Tools, etc. |

### Step 3: Search

- Use the search bar to find projects by name or keyword
- Search is case-insensitive and matches partial terms

### Step 4: Sort Results

- **By Funding**: See highest-funded projects first
- **By Date**: Most recent proposals
- **By Completion**: Progress percentage

---

## Understanding Project Pages

When you click on a project, you'll see:

### Header Section
```
┌─────────────────────────────────────────────────────────┐
│  [Status Badge]  Project Title                          │
│  Fund 12 • Category: DeFi • $45,000 funded             │
└─────────────────────────────────────────────────────────┘
```

**Status Badges:**
- 🟢 **Completed**: All milestones delivered
- 🔵 **In Progress**: Active development
- 🟡 **Funded**: Received funding, work starting
- ⚪ **Not Approved**: Did not receive funding

### Description Section

- **Problem**: What issue does this solve?
- **Solution**: How does it solve it?
- **Experience**: Team's relevant background

### Milestones Section

```
Milestone 1 ────●──────────────────────────────────── Completed ✓
Milestone 2 ────●──────────────────────────────────── In Progress
Milestone 3 ────○──────────────────────────────────── Pending
```

Each milestone shows:
- **Title**: What will be delivered
- **Due Date**: Expected completion
- **Status**: Pending, In Progress, Completed
- **SoM Status**: Statement of Milestone approval
- **PoA Status**: Proof of Achievement status
- **Payment Status**: Disbursement state

### Team Section

Lists all team members with:
- Name (click to view their profile)
- Role on this project
- Accountability badge (if they have project history)

### Voting Results

| Metric | Meaning |
|--------|---------|
| **Yes Votes** | Votes in favor |
| **No Votes** | Votes against |
| **Abstain** | Neither for nor against |
| **Approval Rate** | Yes / (Yes + No) percentage |
| **Fund Rank** | Position among all proposals in fund |

### External Links

Direct links to:
- **Project Catalyst**: Official proposal page
- **Milestones Portal**: Milestone tracking page
- **GitHub**: Source code repository
- **Website**: Project homepage
- **Social**: Twitter, Discord, etc.

### Community Reviews

Read what others have written about this project:
- Overall rating (1-5 stars)
- Review text and reasoning
- Helpful/Not Helpful vote counts

### Flags Section

See any warnings or concerns:
- **Automated Flags**: System-detected issues
- **Community Flags**: User-reported concerns
- **Severity**: Low, Medium, High

---

## Researching People

### Finding a Person

1. Click any team member name on a project page, OR
2. Navigate to **People** in navigation and search

### Person Profile Contents

| Section | Information |
|---------|-------------|
| **Header** | Name, accountability badge |
| **Score** | Overall accountability score (0-100) |
| **Stats** | Total projects, completion rate, funding received |
| **Projects** | All projects they've been involved with |
| **Aliases** | Other names they've used |
| **Organizations** | Associated companies/teams |

### Understanding Accountability Badges

| Badge | Score Range | Meaning |
|-------|-------------|---------|
| 🟢 **TRUSTED** | 80-100 | Consistently delivers, high confidence |
| 🔵 **RELIABLE** | 60-79 | Generally delivers with minor issues |
| 🟡 **UNPROVEN** | 40-59 | Limited history or mixed results |
| 🔴 **CONCERNING** | 0-39 | Pattern of non-delivery or flags |

### Score Breakdown

The accountability score combines:
- **Completion Score**: How many projects completed vs. started
- **Delivery Score**: On-time milestone delivery rate
- **Community Score**: Average ratings from reviews
- **Efficiency Score**: Value delivered vs. funding received
- **Communication Score**: Responsiveness and updates

---

## Using the Network Graph

### Accessing the Graph

Navigate to **Graph** in main navigation.

### What You See

- **Circles (Nodes)**: Projects, People, Funds, Organizations
- **Lines (Edges)**: Relationships between entities
- **Colors**: Indicate type or score

### Node Colors

| Type | Color |
|------|-------|
| **Projects** | Blue |
| **People** | Green (TRUSTED) → Red (CONCERNING) |
| **Funds** | Purple |
| **Organizations** | Orange |

### Interacting with the Graph

| Action | Result |
|--------|--------|
| **Click node** | Show details panel |
| **Drag node** | Reposition |
| **Scroll** | Zoom in/out |
| **Double-click** | Center and zoom |

### Filtering the Graph

Toggle visibility of:
- Project nodes
- People nodes
- Fund nodes
- Organization nodes
- Filter by accountability score range
- Show only flagged entities

### View Modes

| Mode | Shows |
|------|-------|
| **Default** | Standard network layout |
| **Centrality** | Node size = connection count |
| **Clusters** | Groups related entities together |
| **Funding Flow** | Visualizes money flow: Fund → Project → People |

---

## Checking Rankings

### Navigate to Rankings

Click **Rankings** in navigation.

### Available Leaderboards

**Top Projects:**
- By total funding received
- By completion percentage
- By ROI score

**Top Contributors:**
- By number of projects
- By total funding across projects
- By average completion rate

### Filtering Rankings

- Select specific fund(s)
- Choose ranking metric
- View historical trends

---

## Common Questions

### How current is the data?

Data is synchronized regularly from:
- **Catalyst Explorer**: Daily
- **GitHub**: On-demand
- **Milestones Portal**: When available
- **On-chain**: Real-time via Blockfrost

Each data field shows its `lastSeenAt` timestamp.

### Where does the data come from?

Every piece of information includes source provenance:
- `sourceUrl`: Original data location
- `sourceType`: API, scrape, or manual
- `lastSeenAt`: When last verified

### Can I trust the scores?

Scores are **computed from observable data**, not opinions:
- Methodology is documented
- Confidence levels shown
- Raw data available for verification

### How do I report an error?

If you see incorrect data:
1. Create an account (free)
2. Submit a concern with evidence
3. Moderators will review

---

## Next Steps

Want to contribute? [Create an account →](./04-user-guide-member.md)
