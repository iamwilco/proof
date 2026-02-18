/**
 * Catalyst Communities Ingestion Script
 * Fetches official communities from CatalystExplorer API
 * Stores community data with members, proposals, and statistics
 */

import { PrismaClient } from "../src/generated/prisma";

const CATALYST_EXPLORER_API = "https://www.catalystexplorer.com/api/v1";
const PER_PAGE = 24;
const RATE_LIMIT_MS = 500;
const MAX_PAGES = parseInt(process.env.INGEST_MAX_PAGES || "0", 10) || Infinity;

const prisma = new PrismaClient({});

// ============ Type Definitions ============

interface CatalystCommunityUser {
  id: string;
  name: string;
  username?: string;
  role?: string;
  bio?: string;
  joined_at?: string;
}

interface CatalystCommunityProposal {
  id: string;
  title?: string;
  status?: string;
}

interface CatalystCommunityStatistics {
  active_members: number;
  funded_projects: number;
  success_rate: number;
  average_proposal_amount: number;
  total_ada_distributed: number;
}

interface CatalystCommunity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  twitter_handle?: string;
  discord_url?: string;
  verified: boolean;
  members_count: number;
  proposals_count: number;
  funded_proposals_count?: number;
  total_funding_received?: number;
  users?: CatalystCommunityUser[];
  proposals?: CatalystCommunityProposal[];
  statistics?: CatalystCommunityStatistics;
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

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
        const wait = Math.min(retryAfter * 1000, 120000);
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
      const wait = Math.pow(2, attempt) * 1000;
      console.warn(`  Retry ${attempt}/${retries} in ${wait / 1000}s: ${error}`);
      await sleep(wait);
    }
  }
}

// ============ Data Fetching ============

function buildCommunityUrl(page: number): string {
  const params = new URLSearchParams({
    per_page: PER_PAGE.toString(),
    page: page.toString(),
    include: "users,proposals,statistics",
    sort: "-members_count",
  });

  return `${CATALYST_EXPLORER_API}/communities?${params.toString()}`;
}

async function* fetchAllCommunities(): AsyncGenerator<CatalystCommunity> {
  let page = 1;

  while (true) {
    const url = buildCommunityUrl(page);
    console.log(`Fetching communities page ${page}...`);

    const response = await fetchWithRetry<ApiResponse<CatalystCommunity>>(url);
    const communities = response.data || [];

    if (communities.length === 0) break;

    const lastPage = response.meta.last_page || 1;
    const total = response.meta.total || 0;
    console.log(`  Got ${communities.length} communities (page ${page}/${lastPage}, total: ${total})`);

    for (const community of communities) {
      yield community;
    }

    if (page >= lastPage || page >= MAX_PAGES) break;
    page++;
    await sleep(RATE_LIMIT_MS);
  }
}

// ============ Upsert Functions ============

async function upsertCommunity(community: CatalystCommunity): Promise<string> {
  const now = new Date();
  const externalId = community.id;
  const stats = community.statistics;

  const data = {
    externalId,
    name: community.name,
    slug: community.slug || community.name.toLowerCase().replace(/\s+/g, "-"),
    description: community.description || null,
    website: community.website || null,
    twitterHandle: community.twitter_handle || null,
    discordUrl: community.discord_url || null,
    verified: community.verified || false,
    membersCount: community.members_count || 0,
    proposalsCount: community.proposals_count || 0,
    fundedProposalsCount: community.funded_proposals_count || (stats?.funded_projects ?? 0),
    totalFundingReceived: community.total_funding_received || (stats?.total_ada_distributed ?? 0),
    successRate: stats?.success_rate ?? null,
    sourceUrl: `${CATALYST_EXPLORER_API}/communities/${community.id}`,
    sourceType: "catalyst_explorer",
    lastSeenAt: now,
  };

  const existing = await prisma.catalystCommunity.findUnique({
    where: { externalId },
  });

  let communityId: string;

  if (existing) {
    await prisma.catalystCommunity.update({
      where: { id: existing.id },
      data,
    });
    communityId = existing.id;
  } else {
    const created = await prisma.catalystCommunity.create({ data });
    communityId = created.id;
    console.log(`  + Community: ${community.name}`);
  }

  return communityId;
}

async function upsertCommunityMembers(
  communityId: string,
  members: CatalystCommunityUser[]
): Promise<number> {
  let count = 0;

  for (const member of members) {
    await prisma.catalystCommunityMember.upsert({
      where: {
        communityId_externalId: {
          communityId,
          externalId: member.id,
        },
      },
      create: {
        communityId,
        externalId: member.id,
        name: member.name,
        username: member.username || null,
        role: member.role || null,
        bio: member.bio || null,
        joinedAt: member.joined_at ? new Date(member.joined_at) : null,
      },
      update: {
        name: member.name,
        username: member.username || null,
        role: member.role || null,
        bio: member.bio || null,
        joinedAt: member.joined_at ? new Date(member.joined_at) : null,
      },
    });
    count++;
  }

  return count;
}

async function linkCommunityProposals(
  communityId: string,
  proposals: CatalystCommunityProposal[]
): Promise<number> {
  let count = 0;

  for (const proposal of proposals) {
    // Try to find the matching Project by externalId
    const project = await prisma.project.findFirst({
      where: { externalId: proposal.id },
      select: { id: true },
    });

    await prisma.catalystCommunityProposal.upsert({
      where: {
        communityId_externalId: {
          communityId,
          externalId: proposal.id,
        },
      },
      create: {
        communityId,
        externalId: proposal.id,
        projectId: project?.id || null,
        title: proposal.title || null,
        status: proposal.status || null,
      },
      update: {
        projectId: project?.id || null,
        title: proposal.title || null,
        status: proposal.status || null,
      },
    });
    count++;
  }

  return count;
}

// ============ Main ============

async function run(): Promise<void> {
  console.log("=== Catalyst Communities Ingestion ===");
  console.log(`API: ${CATALYST_EXPLORER_API}`);
  console.log(`Max pages: ${MAX_PAGES === Infinity ? "unlimited" : MAX_PAGES}`);
  console.log();

  let communityCount = 0;
  let membersCount = 0;
  let proposalLinksCount = 0;
  const startTime = Date.now();

  try {
    for await (const community of fetchAllCommunities()) {
      const communityId = await upsertCommunity(community);
      communityCount++;

      // Upsert members
      if (community.users && community.users.length > 0) {
        membersCount += await upsertCommunityMembers(communityId, community.users);
      }

      // Link proposals to projects
      if (community.proposals && community.proposals.length > 0) {
        proposalLinksCount += await linkCommunityProposals(communityId, community.proposals);
      }

      if (communityCount % 10 === 0) {
        console.log(`  Processed ${communityCount} communities...`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n=== Communities Ingestion Complete ===");
    console.log(`Duration: ${elapsed}s`);
    console.log(`Communities: ${communityCount}`);
    console.log(`Members: ${membersCount}`);
    console.log(`Proposal links: ${proposalLinksCount}`);

  } catch (error) {
    console.error("Communities ingestion failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
