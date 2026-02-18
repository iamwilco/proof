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
  status?: string;    // --status=funded to filter by status
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
    } else if (arg.startsWith("--status=")) {
      const status = arg.split("=")[1];
      if (["funded", "unfunded", "complete", "over_budget"].includes(status)) {
        options.status = status;
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
  --status=<status>   Filter by status: funded, unfunded, complete, over_budget
  --full              Full ingestion of all proposals (default)
  --help, -h          Show this help message

Examples:
  npx tsx scripts/ingest-catalyst.ts --fund=15
  npx tsx scripts/ingest-catalyst.ts --since=2026-02-01
  npx tsx scripts/ingest-catalyst.ts --status=complete
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

interface CatalystFundStatistics {
  total_voters: number;
  total_voting_power: number;
  participation_rate: number;
  average_proposal_amount: number;
  success_rate: number;
}

interface CatalystFundDetail extends CatalystFund {
  description?: string;
  voting_power_threshold?: number;
  statistics?: CatalystFundStatistics;
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

interface CatalystReviewData {
  id: string;
  reviewer_name?: string;
  rating?: number;
  alignment_note?: string;
  feasibility_note?: string;
  auditability_note?: string;
  alignment_rating?: number;
  feasibility_rating?: number;
  auditability_rating?: number;
}

interface CatalystLinkData {
  id: string;
  type: string;
  url: string;
  title?: string;
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
  reviews_count?: number;
  funded_at?: string;
  website?: string;
  link: string;
  fund?: CatalystFund;
  campaign?: CatalystCampaign;
  team?: CatalystTeamMember[];
  reviews?: CatalystReviewData[];
  links?: CatalystLinkData[];
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

// ============ Fund Statistics ============

const fundStatsCache = new Map<string, CatalystFundDetail>();

async function fetchFundDetail(fundId: string): Promise<CatalystFundDetail | null> {
  if (fundStatsCache.has(fundId)) return fundStatsCache.get(fundId)!;

  try {
    const url = `${CATALYST_EXPLORER_API}/funds/${fundId}?include=statistics`;
    const response = await fetchWithRetry<{ data: CatalystFundDetail }>(url);
    const detail = response.data;
    fundStatsCache.set(fundId, detail);
    return detail;
  } catch (error) {
    console.warn(`  Could not fetch fund detail for ${fundId}: ${error}`);
    return null;
  }
}

// ============ Campaign Budget Tracking ============

interface CatalystCampaignDetail {
  id: string;
  title: string;
  slug?: string;
  budget?: number;
  proposals_count?: number;
  funded_proposals_count?: number;
  total_amount_awarded?: number;
}

const campaignsFetchedForFund = new Set<string>();

async function fetchAndUpsertCampaigns(fundExternalId: string, fundDbId: string): Promise<number> {
  if (campaignsFetchedForFund.has(fundExternalId)) return 0;
  campaignsFetchedForFund.add(fundExternalId);

  try {
    const url = `${CATALYST_EXPLORER_API}/funds/${fundExternalId}/campaigns?per_page=60`;
    const response = await fetchWithRetry<{ data: CatalystCampaignDetail[] }>(url);
    const campaigns = response.data || [];

    if (campaigns.length === 0) return 0;

    const now = new Date();
    let count = 0;

    for (const campaign of campaigns) {
      const externalId = `campaign_${campaign.id}`;
      await prisma.campaign.upsert({
        where: { externalId },
        create: {
          externalId,
          fundId: fundDbId,
          title: campaign.title,
          slug: campaign.slug || null,
          budget: campaign.budget || 0,
          proposalsCount: campaign.proposals_count || 0,
          fundedProposalsCount: campaign.funded_proposals_count || 0,
          totalAmountAwarded: campaign.total_amount_awarded || 0,
          sourceUrl: `${CATALYST_EXPLORER_API}/funds/${fundExternalId}/campaigns`,
          sourceType: "catalyst_explorer",
          lastSeenAt: now,
        },
        update: {
          title: campaign.title,
          slug: campaign.slug || null,
          budget: campaign.budget || 0,
          proposalsCount: campaign.proposals_count || 0,
          fundedProposalsCount: campaign.funded_proposals_count || 0,
          totalAmountAwarded: campaign.total_amount_awarded || 0,
          lastSeenAt: now,
        },
      });
      count++;
    }

    console.log(`  + ${count} campaigns for fund ${fundExternalId}`);
    return count;
  } catch (error) {
    console.warn(`  Could not fetch campaigns for fund ${fundExternalId}: ${error}`);
    return 0;
  }
}

// ============ Data Fetching ============

function buildProposalUrl(page: number, options: CLIOptions): string {
  const params = new URLSearchParams({
    per_page: PER_PAGE.toString(),
    page: page.toString(),
    include: "campaign,fund,team,reviews,links",
  });

  // Use native API filter params for server-side filtering
  if (options.fund) {
    params.set("filter[fund]", options.fund.toString());
  }

  if (options.status) {
    params.set("filter[status]", options.status);
  }

  // Sort by most recently updated for efficient delta sync
  if (options.since) {
    params.set("sort", "-created_at");
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
      // Client-side date filter as fallback (API may not support exact date filtering)
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

  // Fetch fund detail with statistics from dedicated endpoint
  const detail = await fetchFundDetail(fund.id);
  const stats = detail?.statistics;

  const statsData = {
    description: detail?.description || null,
    totalVoters: stats?.total_voters ?? null,
    totalVotingPower: stats?.total_voting_power ?? null,
    participationRate: stats?.participation_rate ?? null,
    votingPowerThreshold: detail?.voting_power_threshold ?? null,
    successRate: stats?.success_rate ?? null,
  };

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
        ...statsData,
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
      ...statsData,
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

  // Build external URLs — point to projectcatalyst.io (official IOG source), not catalystexplorer.com
  // milestones.projectcatalyst.io is the official Milestone Module for funded projects
  const catalystUrl = proposal.id
    ? `https://milestones.projectcatalyst.io/projects/${proposal.id}`
    : null;
  const milestonesUrl = catalystUrl; // Same as catalystUrl — milestones module IS the official project page
  const explorerUrl = null; // Intentionally null — PROOF replaces catalystexplorer.com

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
    reviewsCount: proposal.reviews_count || 0,
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

async function upsertCatalystReviews(
  projectId: string,
  proposalId: string,
  reviews: CatalystReviewData[]
): Promise<number> {
  const now = new Date();
  let count = 0;

  for (const review of reviews) {
    const externalId = `catalyst_review_${review.id}`;
    await prisma.catalystReview.upsert({
      where: { externalId },
      create: {
        externalId,
        projectId,
        reviewerName: review.reviewer_name || null,
        rating: review.rating ?? null,
        alignmentNote: review.alignment_note || null,
        feasibilityNote: review.feasibility_note || null,
        auditabilityNote: review.auditability_note || null,
        alignmentScore: review.alignment_rating ?? null,
        feasibilityScore: review.feasibility_rating ?? null,
        auditabilityScore: review.auditability_rating ?? null,
        sourceUrl: `${CATALYST_EXPLORER_API}/proposals/${proposalId}`,
        sourceType: "catalyst_explorer",
        lastSeenAt: now,
      },
      update: {
        reviewerName: review.reviewer_name || null,
        rating: review.rating ?? null,
        alignmentNote: review.alignment_note || null,
        feasibilityNote: review.feasibility_note || null,
        auditabilityNote: review.auditability_note || null,
        alignmentScore: review.alignment_rating ?? null,
        feasibilityScore: review.feasibility_rating ?? null,
        auditabilityScore: review.auditability_rating ?? null,
        lastSeenAt: now,
      },
    });
    count++;
  }

  // Update reviewsCount on project
  if (count > 0) {
    await prisma.project.update({
      where: { id: projectId },
      data: { reviewsCount: count },
    });
  }

  return count;
}

function classifyLinkType(url: string, apiType?: string): string {
  if (apiType) return apiType;
  if (url.includes("github.com")) return "github_repo";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube_video";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("discord.gg") || url.includes("discord.com")) return "discord";
  if (url.includes("t.me") || url.includes("telegram")) return "telegram";
  return "website";
}

async function upsertProjectLinks(
  projectId: string,
  links: CatalystLinkData[]
): Promise<number> {
  const now = new Date();
  let count = 0;

  for (const link of links) {
    if (!link.url) continue;

    const type = classifyLinkType(link.url, link.type);

    // Check if link already exists for this project+url
    const existing = await prisma.link.findFirst({
      where: { projectId, url: link.url },
    });

    if (existing) {
      await prisma.link.update({
        where: { id: existing.id },
        data: { type, lastSeenAt: now },
      });
    } else {
      await prisma.link.create({
        data: {
          projectId,
          type,
          url: link.url,
          sourceUrl: `${CATALYST_EXPLORER_API}/proposals`,
          sourceType: "catalyst_explorer",
          lastSeenAt: now,
        },
      });
    }
    count++;
  }

  return count;
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
  if (CLI_OPTIONS.status) {
    console.log(`Status filter: ${CLI_OPTIONS.status}`);
  }
  if (CLI_OPTIONS.full && !CLI_OPTIONS.fund && !CLI_OPTIONS.since && !CLI_OPTIONS.status) {
    console.log(`Mode: Full ingestion`);
  }
  console.log();

  let proposalCount = 0;
  let teamLinksCount = 0;
  let reviewsCount = 0;
  let linksCount = 0;
  let campaignsCount = 0;
  const startTime = Date.now();

  try {
    for await (const proposal of fetchAllProposals(CLI_OPTIONS)) {
      // Upsert fund and get fund number for currency normalization
      let fundId: string;
      let fundNumber = 0;
      if (proposal.fund) {
        fundId = await upsertFund(proposal.fund);
        fundNumber = extractFundNumber(proposal.fund.title);
        // Fetch per-campaign budgets for this fund (once per fund)
        campaignsCount += await fetchAndUpsertCampaigns(proposal.fund.id, fundId);
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

      // Store official Catalyst reviews
      if (proposal.reviews && proposal.reviews.length > 0) {
        reviewsCount += await upsertCatalystReviews(projectId, proposal.id, proposal.reviews);
      }

      // Store project links from API
      if (proposal.links && proposal.links.length > 0) {
        linksCount += await upsertProjectLinks(projectId, proposal.links);
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
    console.log(`Catalyst reviews: ${reviewsCount}`);
    console.log(`Project links: ${linksCount}`);
    console.log(`Campaigns: ${campaignsCount}`);

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
