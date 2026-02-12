/**
 * Catalyst Full Ingestion Script
 * Fetches proposals with team members from CatalystExplorer API
 * Links people to projects for transparency graph
 */

import { PrismaClient } from "../src/generated/prisma";

const CATALYST_EXPLORER_API = "https://www.catalystexplorer.com/api/v1";
const PER_PAGE = 60;
const RATE_LIMIT_MS = 500;
const MAX_PAGES = parseInt(process.env.INGEST_MAX_PAGES || "0", 10) || Infinity;

const prisma = new PrismaClient({});

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

async function fetchWithRetry<T>(url: string, retries = 3): Promise<T> {
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
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (attempt >= retries) throw error;
      const wait = Math.pow(1.5, attempt) * 1000;
      console.warn(`  Retry ${attempt}/${retries} in ${wait}ms: ${error}`);
      await sleep(wait);
    }
  }
}

function extractFundNumber(fundTitle: string): number {
  const match = fundTitle.match(/Fund\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

// ============ Data Fetching ============

async function* fetchAllProposals(): AsyncGenerator<CatalystProposal> {
  let page = 1;

  while (true) {
    const url = `${CATALYST_EXPLORER_API}/proposals?per_page=${PER_PAGE}&page=${page}&include=campaign,fund,team`;
    console.log(`Fetching page ${page}...`);

    const response = await fetchWithRetry<ApiResponse<CatalystProposal>>(url);
    const proposals = response.data || [];

    if (proposals.length === 0) break;

    const lastPage = response.meta.last_page || 1;
    console.log(`  Got ${proposals.length} proposals (page ${page}/${lastPage})`);

    for (const proposal of proposals) {
      yield proposal;
    }

    if (page >= lastPage || page >= MAX_PAGES) break;
    page++;
    await sleep(RATE_LIMIT_MS);
  }
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
        currency: fund.currency || "USD",
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
      currency: fund.currency || "USD",
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
  fundId: string
): Promise<string> {
  const now = new Date();
  const sourceUrl = proposal.link || `${CATALYST_EXPLORER_API}/proposals/${proposal.id}`;

  const existing = await prisma.project.findFirst({
    where: { OR: [{ externalId: proposal.id }, { sourceUrl }] },
  });

  const status = proposal.status || "unknown";
  const fundingStatus = proposal.funding_status || (proposal.amount_received > 0 ? "funded" : "pending");

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
    status,
    fundingStatus,
    fundingAmount: proposal.amount_requested || 0,
    amountReceived: proposal.amount_received || 0,
    currency: proposal.currency || "USD",
    yesVotes: proposal.yes_votes_count || 0,
    noVotes: proposal.no_votes_count || 0,
    fundedAt: proposal.funded_at ? new Date(proposal.funded_at) : null,
    website: proposal.website,
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
    const stats = await prisma.project.aggregate({
      where: { fundId: fund.id },
      _count: true,
      _sum: { fundingAmount: true, amountReceived: true },
    });

    const funded = await prisma.project.count({
      where: { fundId: fund.id, fundingStatus: "funded" },
    });

    const completed = await prisma.project.count({
      where: { fundId: fund.id, status: "complete" },
    });

    await prisma.fund.update({
      where: { id: fund.id },
      data: {
        proposalsCount: stats._count,
        fundedProposalsCount: funded,
        completedProposalsCount: completed,
        totalAwarded: stats._sum.fundingAmount || 0,
        totalDistributed: stats._sum.amountReceived || 0,
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
  console.log("=== Catalyst Full Ingestion ===");
  console.log(`API: ${CATALYST_EXPLORER_API}`);
  console.log(`Max pages: ${MAX_PAGES === Infinity ? "unlimited" : MAX_PAGES}\n`);

  let proposalCount = 0;
  let teamLinksCount = 0;

  try {
    for await (const proposal of fetchAllProposals()) {
      // Upsert fund
      let fundId: string;
      if (proposal.fund) {
        fundId = await upsertFund(proposal.fund);
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

      // Upsert proposal
      const projectId = await upsertProposal(proposal, fundId);
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

    console.log("\n=== Ingestion Complete ===");
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
