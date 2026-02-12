/**
 * Catalyst Proposal Ingestion Script
 * Fetches proposals from CatalystExplorer API and upserts to PROOF database
 */

import { PrismaClient } from "../src/generated/prisma";

const CATALYST_EXPLORER_API = "https://www.catalystexplorer.com/api/v1";
const PER_PAGE = 60;
const RATE_LIMIT_MS = 500;
const MAX_PAGES = parseInt(process.env.INGEST_MAX_PAGES || "0", 10) || Infinity;

const prisma = new PrismaClient({});

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

interface CatalystProposal {
  id: string;
  title: string;
  slug: string;
  problem: string;
  solution: string;
  status: string;
  amount_requested: number;
  amount_received: number;
  currency: string;
  funded: boolean;
  completed: boolean;
  opensource: boolean;
  link: string;
  fund?: CatalystFund;
  campaign?: CatalystCampaign;
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
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
  url: string,
  retries = 3,
  backoff = 1.5
): Promise<T> {
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
      if (attempt >= retries) {
        throw error;
      }
      const wait = Math.pow(backoff, attempt) * 1000;
      console.warn(
        `Request failed (attempt ${attempt}/${retries}): ${error}. Retrying in ${wait}ms`
      );
      await sleep(wait);
    }
  }
}

async function* fetchAllProposals(): AsyncGenerator<CatalystProposal> {
  let page = 1;

  while (true) {
    const url = `${CATALYST_EXPLORER_API}/proposals?per_page=${PER_PAGE}&page=${page}&include=campaign,fund`;
    console.log(`Fetching page ${page}...`);

    const response = await fetchWithRetry<ApiResponse<CatalystProposal>>(url);
    const proposals = response.data || [];

    if (proposals.length === 0) {
      break;
    }

    const lastPage = response.meta.last_page || 1;
    console.log(
      `  Got ${proposals.length} proposals (page ${page}/${lastPage}, total: ${response.meta.total})`
    );

    for (const proposal of proposals) {
      yield proposal;
    }

    if (page >= lastPage || page >= MAX_PAGES) {
      break;
    }
    
    page++;

    // Rate limiting
    await sleep(RATE_LIMIT_MS);
  }
}

function extractFundNumber(fundTitle: string): number {
  const match = fundTitle.match(/Fund\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function mapStatus(proposal: CatalystProposal): string {
  if (proposal.completed) return "completed";
  if (proposal.funded) return "funded";
  return proposal.status || "unknown";
}

async function upsertFund(fund: CatalystFund): Promise<string> {
  const fundNumber = extractFundNumber(fund.title);
  const now = new Date();

  const existing = await prisma.fund.findFirst({
    where: { number: fundNumber },
  });

  if (existing) {
    await prisma.fund.update({
      where: { id: existing.id },
      data: {
        name: fund.title,
        lastSeenAt: now,
      },
    });
    return existing.id;
  }

  const created = await prisma.fund.create({
    data: {
      name: fund.title,
      number: fundNumber,
      startDate: fund.launched_at ? new Date(fund.launched_at) : null,
      sourceUrl: `${CATALYST_EXPLORER_API}/funds/${fund.id}`,
      sourceType: "catalyst_explorer_api",
      lastSeenAt: now,
    },
  });
  console.log(`  Created fund: ${fund.title}`);
  return created.id;
}

async function upsertProposal(
  proposal: CatalystProposal,
  fundId: string
): Promise<void> {
  const now = new Date();
  const sourceUrl = proposal.link || `${CATALYST_EXPLORER_API}/proposals/${proposal.id}`;

  const existing = await prisma.project.findFirst({
    where: { sourceUrl },
  });

  const data = {
    fundId,
    title: proposal.title || "Untitled",
    description: proposal.problem || proposal.solution || "",
    category: proposal.campaign?.title || "Uncategorized",
    status: mapStatus(proposal),
    fundingAmount: proposal.amount_requested || 0,
    sourceUrl,
    sourceType: "catalyst_explorer_api",
    lastSeenAt: now,
  };

  if (existing) {
    await prisma.project.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.project.create({ data });
  }
}

async function run(): Promise<void> {
  console.log("Starting Catalyst proposal ingestion...");
  console.log(`API: ${CATALYST_EXPLORER_API}`);

  const fundCache = new Map<string, string>();
  let proposalCount = 0;
  let fundCount = 0;

  try {
    for await (const proposal of fetchAllProposals()) {
      // Handle fund
      let fundId: string;
      if (proposal.fund) {
        const cachedFundId = fundCache.get(proposal.fund.id);
        if (cachedFundId) {
          fundId = cachedFundId;
        } else {
          fundId = await upsertFund(proposal.fund);
          fundCache.set(proposal.fund.id, fundId);
          fundCount++;
        }
      } else {
        // Create or get a default "Unknown Fund"
        const defaultFund = await prisma.fund.findFirst({
          where: { number: 0 },
        });
        if (defaultFund) {
          fundId = defaultFund.id;
        } else {
          const created = await prisma.fund.create({
            data: {
              name: "Unknown Fund",
              number: 0,
              sourceUrl: CATALYST_EXPLORER_API,
              sourceType: "catalyst_explorer_api",
              lastSeenAt: new Date(),
            },
          });
          fundId = created.id;
        }
      }

      // Upsert proposal
      await upsertProposal(proposal, fundId);
      proposalCount++;

      if (proposalCount % 100 === 0) {
        console.log(`  Processed ${proposalCount} proposals...`);
      }
    }

    console.log("\n=== Ingestion Complete ===");
    console.log(`Funds processed: ${fundCount}`);
    console.log(`Proposals processed: ${proposalCount}`);
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
