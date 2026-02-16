# PROOF Knowledge Base - Technical Architecture

> For developers and technical users

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  Next.js 16 App Router │ React 19 │ TypeScript │ Tailwind CSS           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                      │
│  Next.js Route Handlers │ Server Components │ Server Actions            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                              │
│  ROI Engine │ Flag Detection │ Auth │ Identity Resolution               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                     │
│  Prisma ORM │ PostgreSQL (Supabase) │ 40+ Models                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ETL PIPELINE                                     │
│  TypeScript Ingestion │ Python Scrapers │ External API Clients          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **TanStack Query** | 5.x | Data fetching and caching |
| **Cytoscape.js** | 3.33 | Network graph visualization |
| **react-cytoscapejs** | 2.0 | React wrapper for Cytoscape |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 16.x | Server-side endpoints |
| **Prisma** | 6.2 | Database ORM |
| **PostgreSQL** | 15.x | Primary database (via Supabase) |
| **Supabase** | 2.x | Database hosting, auth helpers |

### ETL Pipeline

| Technology | Version | Purpose |
|------------|---------|---------|
| **tsx** | 4.7 | TypeScript execution |
| **Python** | 3.11+ | Scrapers and data processing |
| **requests** | 2.32 | HTTP client |
| **BeautifulSoup4** | 4.12 | HTML parsing |
| **SQLAlchemy** | 2.0 | Python database access |
| **pandas** | 2.2 | Data manipulation |
| **NetworkX** | 3.4 | Graph analysis |

---

## Directory Structure

```
proof/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API route handlers
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── graph/          # Network graph data
│   │   │   ├── flags/          # Flag management
│   │   │   ├── reviews/        # Review CRUD
│   │   │   └── sync/           # Data synchronization
│   │   ├── projects/           # Project pages
│   │   │   └── [id]/           # Dynamic project detail
│   │   ├── people/             # People pages
│   │   ├── funds/              # Fund pages
│   │   ├── graph/              # Network visualization
│   │   ├── admin/              # Admin dashboards
│   │   └── ...                 # Other routes
│   ├── components/             # Reusable UI components
│   │   ├── Navigation.tsx
│   │   ├── RankingBadge.tsx
│   │   ├── ConnectionHoverCard.tsx
│   │   └── ...
│   └── lib/                    # Core business logic
│       ├── auth/               # Authentication
│       │   ├── session.ts      # Session management
│       │   └── nextauth.ts     # Auth providers
│       ├── roi.ts              # ROI scoring engine
│       ├── flagDetection.ts    # Automated flag detection
│       ├── github.ts           # GitHub API client
│       ├── blockfrost.ts       # Blockfrost API client
│       ├── catalyst-api.ts     # Catalyst Explorer client
│       ├── prisma.ts           # Prisma client singleton
│       └── recommendations.ts  # Project recommendations
├── prisma/
│   ├── schema.prisma           # Database schema (990 lines)
│   └── migrations/             # Schema migrations
├── scripts/                    # TypeScript ingestion scripts
│   ├── ingest-catalyst.ts      # Catalyst proposal ingestion
│   ├── ingest-milestones.ts    # Milestone ingestion
│   └── sync-github.ts          # GitHub metrics sync
├── etl/                        # Python ETL pipeline
│   ├── catalyst/
│   │   ├── ingest_proposals.py
│   │   ├── ingest_milestones.py
│   │   ├── identity_resolution.py
│   │   ├── link_extraction.py
│   │   └── scrape_*.py
│   └── requirements.txt
├── docs/                       # Documentation
│   └── knowledge-base/         # This knowledge base
└── .agent/                     # Development context
    └── prd/                    # Product requirements
```

---

## Database Schema

### Core Entity Models

**Fund**
```prisma
model Fund {
  id                    String    @id @default(uuid())
  externalId            String?   @unique
  name                  String
  number                Int       @unique
  totalBudget           Decimal   @db.Decimal(18, 2)
  totalAwarded          Decimal   @db.Decimal(18, 2)
  proposalsCount        Int       @default(0)
  fundedProposalsCount  Int       @default(0)
  projects              Project[]
}
```

**Project**
```prisma
model Project {
  id                    String    @id @default(uuid())
  externalId            String?   @unique
  catalystId            String?
  fundId                String
  fund                  Fund      @relation(...)
  title                 String
  slug                  String?
  description           String
  category              String
  status                String
  fundingAmount         Decimal   @db.Decimal(18, 2)
  yesVotes              Int       @default(0)
  noVotes               Int       @default(0)
  githubUrl             String?
  githubStars           Int?
  onchainTxCount        Int?
  milestonesTotal       Int       @default(0)
  milestonesCompleted   Int       @default(0)
  // Relations
  milestones            Milestone[]
  projectPeople         ProjectPerson[]
  reviews               Review[]
  flags                 Flag[]
  roiScores             ProjectROI[]
}
```

**Person**
```prisma
model Person {
  id                    String    @id @default(uuid())
  externalId            String?   @unique
  name                  String
  aliases               String[]
  proposalsCount        Int       @default(0)
  totalAmountAwarded    Decimal   @db.Decimal(18, 2)
  accountabilityScore   AccountabilityScore?
  projectPeople         ProjectPerson[]
}
```

### Community Models

```prisma
model Review {
  id              String   @id @default(uuid())
  projectId       String
  userId          String
  rating          Int      // 1-5
  title           String
  content         String
  alignmentScore  Int?
  feasibilityScore Int?
  auditabilityScore Int?
  helpfulCount    Int      @default(0)
  notHelpfulCount Int      @default(0)
  createdAt       DateTime @default(now())
}

model Flag {
  id          String   @id @default(uuid())
  projectId   String
  type        String   // automated | community
  category    String   // repeat_delays, similar_proposal, etc.
  severity    String   // low | medium | high | critical
  status      String   // pending | confirmed | dismissed
  description String?
  evidence    String?
  createdAt   DateTime @default(now())
}

model AccountabilityScore {
  id              String   @id @default(uuid())
  personId        String   @unique
  overallScore    Float
  completionScore Float
  deliveryScore   Float
  communityScore  Float
  badge           String   // TRUSTED | RELIABLE | UNPROVEN | CONCERNING
  confidence      Float
  calculatedAt    DateTime @default(now())
}
```

---

## Authentication Flow

### Magic Link

```
1. User enters email → POST /api/auth/magic-link
2. Server generates token → stores in MagicLinkToken table
3. Email sent with link containing token
4. User clicks link → GET /api/auth/verify?token=xxx
5. Server verifies token → creates Session
6. Session cookie set → user redirected
```

### Wallet Auth (CIP-30)

```
1. User connects wallet → Client requests nonce
2. GET /api/auth/nonce?address=xxx → returns random nonce
3. User signs nonce with wallet
4. POST /api/auth/wallet → signature verified
5. Session created → cookie set
```

### Session Management

```typescript
// src/lib/auth/session.ts
export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;
  
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });
  
  if (!session || session.expiresAt < new Date()) return null;
  return session;
});

export async function requireRole(roles: UserRole[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}
```

---

## ROI Scoring Engine

### Calculation Flow

```typescript
// src/lib/roi.ts

const WEIGHTS = {
  github: 0.4,
  deliverables: 0.3,
  onchain: 0.3,
};

async function calculateProjectROI(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { milestones: true },
  });

  const githubScore = calculateGitHubScore(project);
  const deliverableScore = await calculateDeliverableScore(projectId);
  const onchainScore = calculateOnchainScore(project);

  const outcomeScore = 
    githubScore * WEIGHTS.github +
    deliverableScore * WEIGHTS.deliverables +
    onchainScore * WEIGHTS.onchain;

  const roiScore = calculateROIScore(outcomeScore, project.fundingAmount);

  return { githubScore, deliverableScore, onchainScore, outcomeScore, roiScore };
}
```

### Component Calculations

**GitHub Score (0-100)**
```typescript
function calculateGitHubScore(project) {
  const activityScore = project.githubActivityScore ?? 0;
  const starsBonus = Math.min((project.githubStars ?? 0) / 100, 20);
  const forksBonus = Math.min((project.githubForks ?? 0) / 20, 15);
  const contributorsBonus = Math.min((project.githubContributors ?? 0) * 2, 15);
  return Math.min(activityScore * 0.5 + starsBonus + forksBonus + contributorsBonus, 100);
}
```

**Deliverable Score (0-100)**
```typescript
async function calculateDeliverableScore(projectId) {
  const milestones = await prisma.milestone.findMany({ where: { projectId } });
  const completed = milestones.filter(m => m.status === "completed").length;
  const completionRate = completed / milestones.length;
  const onTimeRate = calculateOnTimeRate(milestones);
  return completionRate * 70 + onTimeRate * 30;
}
```

---

## ETL Pipeline

### TypeScript Ingestion

**Catalyst Proposals** (`scripts/ingest-catalyst.ts`)
```typescript
const CATALYST_EXPLORER_API = "https://www.catalystexplorer.com/api/v1";

async function* fetchAllProposals() {
  let page = 1;
  while (true) {
    const url = `${CATALYST_EXPLORER_API}/proposals?per_page=60&page=${page}`;
    const response = await fetchWithRetry(url);
    if (response.data.length === 0) break;
    for (const proposal of response.data) yield proposal;
    page++;
    await sleep(500); // Rate limiting
  }
}

async function main() {
  for await (const proposal of fetchAllProposals()) {
    await upsertFund(proposal.fund);
    await upsertProposal(proposal);
    await linkTeamToProject(proposal);
  }
  await computeFundStats();
  await computePersonStats();
}
```

### Python Scrapers

**Identity Resolution** (`etl/catalyst/identity_resolution.py`)
```python
def resolve_people(proposals, threshold=0.86):
    people = []
    for proposal in proposals:
        for name in extract_people_from_proposal(proposal):
            normalized = normalize_name(name)
            matched = False
            for person in people:
                score = similarity(normalized, normalize_name(person.canonical_name))
                if score >= threshold:
                    person.aliases.append(name)
                    matched = True
                    break
            if not matched:
                people.append(PersonRecord(canonical_name=name))
    return people
```

---

## API Reference

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List projects with filters |
| `/api/projects/[id]` | GET | Project detail |
| `/api/people` | GET | List people |
| `/api/people/[id]` | GET | Person profile |
| `/api/graph` | GET | Network graph data |
| `/api/funds` | GET | List funds |

### Authenticated Endpoints

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/reviews` | POST | MEMBER+ | Create review |
| `/api/concerns` | POST | MEMBER+ | Submit concern |
| `/api/reports` | POST | PROPOSER+ | Submit monthly report |
| `/api/flags/[id]` | PATCH | MODERATOR+ | Update flag status |
| `/api/sync` | POST | ADMIN | Trigger data sync |

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# External APIs
GITHUB_TOKEN="ghp_xxx"
BLOCKFROST_API_KEY="mainnetXxx"

# Application
NEXT_PUBLIC_SITE_URL="https://proof.example.com"
SESSION_SECRET="random-32-byte-string"
```

---

## Running Locally

```bash
# Clone and install
git clone <repo>
cd proof
npm install

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev

# Run ingestion
npx tsx scripts/ingest-catalyst.ts

# Python ETL (optional)
cd etl
pip install -r requirements.txt
python -m catalyst.ingest_proposals
```
