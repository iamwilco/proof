/**
 * Catalyst Full Ingestion Script
 * Fetches proposals with team members from CatalystExplorer API
 * Links people to projects for transparency graph
 */

import { PrismaClient } from "../src/generated/prisma";
import { normalizeToUSD } from "../src/lib/currency";

const CATALYST_EXPLORER_API = "https://www.catalystexplorer.com/api/v1";
const PER_PAGE = 60;
const RATE_LIMIT_MS = 500;
const MAX_PAGES = parseInt(process.env.INGEST_MAX_PAGES || "0", 10) || Infinity;

const prisma = new PrismaClient({});

// ============ CLI Arguments ============

interface CLIOptions {
  fund?: number;      // --fund=15 to ingest only Fund 15
  since?: Date;       // --since=2026-02-01 for delta sync
  full: boolean;      // --full for full refresh (default)
  help: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = { full: true, help: false };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("--fund=")) {
      const fundNum = parseInt(arg.split("=")[1], 10);
      if (!isNaN(fundNum) && fundNum > 0) {
        options.fund = fundNum;
        options.full = false;
      }
    } else if (arg.startsWith("--since=")) {
      const dateStr = arg.split("=")[1];
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        options.since = date;
        options.full = false;
      }
    } else if (arg === "--full") {
      options.full = true;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Catalyst Ingestion Script

Usage:
  npx tsx scripts/ingest-catalyst.ts [options]

Options:
  --fund=<number>     Ingest only specific fund (e.g., --fund=15)
  --since=<date>      Ingest proposals updated since date (e.g., --since=2026-02-01)
  --full              Full ingestion of all proposals (default)
  --help, -h          Show this help message

Examples:
  npx tsx scripts/ingest-catalyst.ts --fund=15
  npx tsx scripts/ingest-catalyst.ts --since=2026-02-01
  npx tsx scripts/ingest-catalyst.ts --fund=14 --since=2026-01-15
  npx tsx scripts/ingest-catalyst.ts --full

Environment Variables:
  INGEST_MAX_PAGES    Limit number of pages fetched (default: unlimited)
`);
}

const CLI_OPTIONS = parseArgs();

// ============ Type Definitions ============

interface CatalystFund {
  id: string;
  title: string;
  slug: string;
  label: string;
  status: string;
  currency: string;
  amount: number;
  launched_at: string;
}

interface CatalystCampaign {
  id: string;
  title: string;
  slug: string;
}

interface CatalystTeamMember {
  id: string;
  ideascale_id?: string;
  username?: string;
  name: string;
  bio?: string;
  title?: string;
  proposals_count?: number;
  hero_img_url?: string;
}

interface CatalystProposal {
  id: string;
  title: string;
  slug: string;
  problem: string;
  solution: string;
  experience?: string;
  status: string;
  funding_status?: string;
  amount_requested: number;
  amount_received: number;
  currency: string;
  yes_votes_count?: number;
  no_votes_count?: number;
  funded_at?: string;
  website?: string;
  link: string;
  fund?: CatalystFund;
  campaign?: CatalystCampaign;
  team?: CatalystTeamMember[];
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

// ============ Utilities ============

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(url: string, retries = 5): Promise<T> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "PROOF-Ingestion/1.0",
        },
      });
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
        const wait = Math.min(retryAfter * 1000, 120000); // Max 2 minutes
        console.warn(`  Rate limited. Waiting ${wait / 1000}s before retry...`);
        await sleep(wait);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (attempt >= retries) throw error;
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      const wait = Math.pow(2, attempt) * 1000;
      console.warn(`  Retry ${attempt}/${retries} in ${wait / 1000}s: ${error}`);
      await sleep(wait);
    }
  }
}

function extractFundNumber(fundTitle: string): number {
  const match = fundTitle.match(/Fund\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

// ============ Data Fetching ============

function buildProposalUrl(page: number, options: CLIOptions): string {
  const params = new URLSearchParams({
    per_page: PER_PAGE.toString(),
    page: page.toString(),
    include: "campaign,fund,team",
  });

  // Add fund filter if specified
  if (options.fund) {
    params.set("fund", `Fund ${options.fund}`);
  }

  // Add date filter if specified (updated_at >= since)
  if (options.since) {
    params.set("updated_after", options.since.toISOString().split("T")[0]);
  }

  return `${CATALYST_EXPLORER_API}/proposals?${params.toString()}`;
}

async function* fetchAllProposals(options: CLIOptions): AsyncGenerator<CatalystProposal> {
  let page = 1;
  let totalYielded = 0;

  while (true) {
    const url = buildProposalUrl(page, options);
    console.log(`Fetching page ${page}...`);

    const response = await fetchWithRetry<ApiResponse<CatalystProposal>>(url);
    const proposals = response.data || [];

    if (proposals.length === 0) break;

    const lastPage = response.meta.last_page || 1;
    const total = response.meta.total || 0;
    console.log(`  Got ${proposals.length} proposals (page ${page}/${lastPage}, total: ${total})`);

    for (const proposal of proposals) {
      // Additional client-side filtering for fund number if API doesn't support exact match
      if (options.fund && proposal.fund) {
        const fundNum = extractFundNumber(proposal.fund.title);
        if (fundNum !== options.fund) continue;
      }

      // Additional client-side filtering for date if API doesn't support it
      if (options.since && proposal.updated_at) {
        const updatedAt = new Date(proposal.updated_at);
        if (updatedAt < options.since) continue;
      }

      yield proposal;
      totalYielded++;
    }

    if (page >= lastPage || page >= MAX_PAGES) break;
    page++;
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`  Total proposals yielded: ${totalYielded}`);
}

// ============ Upsert Functions ============

const fundCache = new Map<string, string>();
const personCache = new Map<string, string>();

async function upsertFund(fund: CatalystFund): Promise<string> {
  const cacheKey = fund.id;
  if (fundCache.has(cacheKey)) return fundCache.get(cacheKey)!;

  const fundNumber = extractFundNumber(fund.title);
  const now = new Date();

  const existing = await prisma.fund.findFirst({
    where: { OR: [{ externalId: fund.id }, { number: fundNumber }] },
  });

  if (existing) {
    await prisma.fund.update({
      where: { id: existing.id },
      data: {
        externalId: fund.id,
        name: fund.title,
        slug: fund.slug,
        status: fund.status || "active",
        currency: fund.currency || "USD",  // Use API-provided currency (USD for F2-9, ADA for F10+)
        totalBudget: fund.amount || 0,
        lastSeenAt: now,
      },
    });
    fundCache.set(cacheKey, existing.id);
    return existing.id;
  }

  const created = await prisma.fund.create({
    data: {
      externalId: fund.id,
      name: fund.title,
      number: fundNumber,
      slug: fund.slug,
      status: fund.status || "active",
      currency: fund.currency || "USD",  // Use API-provided currency (USD for F2-9, ADA for F10+)
      totalBudget: fund.amount || 0,
      startDate: fund.launched_at ? new Date(fund.launched_at) : null,
      sourceUrl: `${CATALYST_EXPLORER_API}/funds/${fund.id}`,
      sourceType: "catalyst_explorer",
      lastSeenAt: now,
    },
  });
  console.log(`  + Fund: ${fund.title}`);
  fundCache.set(cacheKey, created.id);
  return created.id;
}

async function upsertPerson(member: CatalystTeamMember): Promise<string> {
  const cacheKey = member.id;
  if (personCache.has(cacheKey)) return personCache.get(cacheKey)!;

  const now = new Date();

  const existing = await prisma.person.findFirst({
    where: { externalId: member.id },
  });

  if (existing) {
    await prisma.person.update({
      where: { id: existing.id },
      data: {
        name: member.name || existing.name,
        username: member.username || existing.username,
        bio: member.bio || existing.bio,
        heroImgUrl: member.hero_img_url || existing.heroImgUrl,
        lastSeenAt: now,
      },
    });
    personCache.set(cacheKey, existing.id);
    return existing.id;
  }

  const created = await prisma.person.create({
    data: {
      externalId: member.id,
      name: member.name || "Unknown",
      username: member.username,
      bio: member.bio,
      heroImgUrl: member.hero_img_url,
      sourceUrl: `https://www.catalystexplorer.com/people/${member.id}`,
      sourceType: "catalyst_explorer",
      lastSeenAt: now,
    },
  });
  personCache.set(cacheKey, created.id);
  return created.id;
}

async function upsertProposal(
  proposal: CatalystProposal,
  fundId: string,
  fundNumber: number
): Promise<string> {
  const now = new Date();
  const sourceUrl = proposal.link || `${CATALYST_EXPLORER_API}/proposals/${proposal.id}`;

  const existing = await prisma.project.findFirst({
    where: { OR: [{ externalId: proposal.id }, { sourceUrl }] },
  });

  const status = proposal.status || "unknown";
  const fundingStatus = proposal.funding_status || (proposal.amount_received > 0 ? "funded" : "pending");
  
  // Get original amounts
  const fundingAmount = proposal.amount_requested || 0;
  const amountReceived = proposal.amount_received || 0;
  const currency = proposal.currency || (fundNumber >= 10 ? "ADA" : "USD");
  
  // Normalize to USD for comparison
  const fundingAmountUSD = normalizeToUSD(fundingAmount, fundNumber, currency);
  const amountReceivedUSD = normalizeToUSD(amountReceived, fundNumber, currency);

  // Build external URLs
  const catalystUrl = proposal.link || null;
  const milestonesUrl = proposal.id 
    ? `https://milestones.projectcatalyst.io/projects/${proposal.id}` 
    : null;
  const explorerUrl = proposal.slug && fundNumber
    ? `https://www.catalystexplorer.com/proposals/${proposal.slug}`
    : null;

  const data = {
    externalId: proposal.id,
    fundId,
    title: proposal.title || "Untitled",
    slug: proposal.slug,
    description: proposal.problem || proposal.solution || "",
    problem: proposal.problem,
    solution: proposal.solution,
    experience: proposal.experience,
    category: proposal.campaign?.title || "Uncategorized",
    challenge: proposal.campaign?.title || null,
    status,
    fundingStatus,
    fundingAmount,
    fundingAmountUSD,
    amountReceived,
    amountReceivedUSD,
    currency,
    yesVotes: proposal.yes_votes_count || 0,
    noVotes: proposal.no_votes_count || 0,
    fundedAt: proposal.funded_at ? new Date(proposal.funded_at) : null,
    website: proposal.website,
    catalystUrl,
    milestonesUrl,
    explorerUrl,
    sourceUrl,
    sourceType: "catalyst_explorer",
    lastSeenAt: now,
  };

  let projectId: string;

  if (existing) {
    await prisma.project.update({
      where: { id: existing.id },
      data,
    });
    projectId = existing.id;
  } else {
    const created = await prisma.project.create({ data });
    projectId = created.id;
  }

  return projectId;
}

async function linkTeamToProject(
  projectId: string,
  team: CatalystTeamMember[]
): Promise<void> {
  for (let i = 0; i < team.length; i++) {
    const member = team[i];
    const personId = await upsertPerson(member);

    // Upsert ProjectPerson link
    await prisma.projectPerson.upsert({
      where: {
        projectId_personId: { projectId, personId },
      },
      create: {
        projectId,
        personId,
        role: member.title || null,
        isPrimary: i === 0, // First team member is primary
      },
      update: {
        role: member.title || null,
        isPrimary: i === 0,
      },
    });
  }
}

// ============ Stats Computation ============

async function computeFundStats(): Promise<void> {
  console.log("\nComputing fund statistics...");

  const funds = await prisma.fund.findMany({ select: { id: true } });

  for (const fund of funds) {
    // Count all proposals in fund
    const totalCount = await prisma.project.count({
      where: { fundId: fund.id },
    });

    // Count and sum ONLY funded proposals (fundingStatus = 'funded')
    const fundedStats = await prisma.project.aggregate({
      where: {
        fundId: fund.id,
        fundingStatus: "funded",
      },
      _count: true,
      _sum: { fundingAmount: true, amountReceived: true },
    });

    const completed = await prisma.project.count({
      where: { fundId: fund.id, status: "complete" },
    });

    // totalAwarded = sum of fundingAmount for FUNDED projects only
    // totalDistributed = sum of amountReceived (actual disbursements)
    await prisma.fund.update({
      where: { id: fund.id },
      data: {
        proposalsCount: totalCount,
        fundedProposalsCount: fundedStats._count,
        completedProposalsCount: completed,
        totalAwarded: fundedStats._sum.fundingAmount || 0,
        totalDistributed: fundedStats._sum.amountReceived || 0,
        // Don't override currency here - it's set correctly during fund upsert
      },
    });
  }
}

async function computePersonStats(): Promise<void> {
  console.log("Computing person statistics...");

  const persons = await prisma.person.findMany({ select: { id: true } });

  for (const person of persons) {
    const projectIds = await prisma.projectPerson.findMany({
      where: { personId: person.id },
      select: { projectId: true },
    });

    if (projectIds.length === 0) continue;

    const ids = projectIds.map((p) => p.projectId);

    const stats = await prisma.project.aggregate({
      where: { id: { in: ids } },
      _count: true,
      _sum: { fundingAmount: true, amountReceived: true },
    });

    const funded = await prisma.project.count({
      where: { id: { in: ids }, fundingStatus: "funded" },
    });

    const completed = await prisma.project.count({
      where: { id: { in: ids }, status: "complete" },
    });

    await prisma.person.update({
      where: { id: person.id },
      data: {
        proposalsCount: stats._count,
        fundedProposalsCount: funded,
        completedProposalsCount: completed,
        totalAmountRequested: stats._sum.fundingAmount || 0,
        totalAmountReceived: stats._sum.amountReceived || 0,
        totalAmountAwarded: stats._sum.fundingAmount || 0,
      },
    });
  }
}

// ============ Main ============

async function run(): Promise<void> {
  // Handle help flag
  if (CLI_OPTIONS.help) {
    printHelp();
    return;
  }

  // Print run configuration
  console.log("=== Catalyst Ingestion ===");
  console.log(`API: ${CATALYST_EXPLORER_API}`);
  console.log(`Max pages: ${MAX_PAGES === Infinity ? "unlimited" : MAX_PAGES}`);
  
  if (CLI_OPTIONS.fund) {
    console.log(`Fund filter: Fund ${CLI_OPTIONS.fund}`);
  }
  if (CLI_OPTIONS.since) {
    console.log(`Since filter: ${CLI_OPTIONS.since.toISOString().split("T")[0]}`);
  }
  if (CLI_OPTIONS.full && !CLI_OPTIONS.fund && !CLI_OPTIONS.since) {
    console.log(`Mode: Full ingestion`);
  }
  console.log();

  let proposalCount = 0;
  let teamLinksCount = 0;
  const startTime = Date.now();

  try {
    for await (const proposal of fetchAllProposals(CLI_OPTIONS)) {
      // Upsert fund and get fund number for currency normalization
      let fundId: string;
      let fundNumber = 0;
      if (proposal.fund) {
        fundId = await upsertFund(proposal.fund);
        fundNumber = extractFundNumber(proposal.fund.title);
      } else {
        const defaultFund = await prisma.fund.upsert({
          where: { externalId: "unknown" },
          create: {
            externalId: "unknown",
            name: "Unknown Fund",
            number: 0,
            sourceUrl: CATALYST_EXPLORER_API,
            sourceType: "catalyst_explorer",
            lastSeenAt: new Date(),
          },
          update: { lastSeenAt: new Date() },
        });
        fundId = defaultFund.id;
      }

      // Upsert proposal with currency normalization
      const projectId = await upsertProposal(proposal, fundId, fundNumber);
      proposalCount++;

      // Link team members
      if (proposal.team && proposal.team.length > 0) {
        await linkTeamToProject(projectId, proposal.team);
        teamLinksCount += proposal.team.length;
      }

      if (proposalCount % 100 === 0) {
        console.log(`  Processed ${proposalCount} proposals, ${personCache.size} people...`);
      }
    }

    // Compute aggregate stats
    await computeFundStats();
    await computePersonStats();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n=== Ingestion Complete ===");
    console.log(`Duration: ${elapsed}s`);
    console.log(`Funds: ${fundCache.size}`);
    console.log(`Proposals: ${proposalCount}`);
    console.log(`People: ${personCache.size}`);
    console.log(`Team links: ${teamLinksCount}`);

  } catch (error) {
    console.error("Ingestion failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
