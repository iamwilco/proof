/**
 * Catalyst API Integration Service
 * Provides real-time data fetching from external Catalyst APIs
 */

// API Endpoints
const CATALYST_EXPLORER_API = "https://www.catalystexplorer.com/api/v1";
const MILESTONES_API = "https://milestones.projectcatalyst.io/api";

// Types
export interface CatalystProposal {
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
  fund?: {
    id: string;
    title: string;
    slug: string;
    status: string;
    currency: string;
    amount: number;
  };
  campaign?: {
    id: string;
    title: string;
    slug: string;
  };
  team?: Array<{
    id: string;
    name: string;
    username?: string;
    bio?: string;
    title?: string;
  }>;
}

export interface MilestoneProject {
  id: number;
  project_id: number;
  title: string;
  slug: string;
  status: string;
  budget: number;
  currency: string;
  milestones_qty: number;
  milestones_completed: number;
}

export interface MilestoneDetail {
  id: number;
  project_id: number;
  milestone_number: number;
  title: string;
  description?: string;
  status: string;
  cost?: number;
  som_status?: string;
  poa_status?: string;
  payment_status?: string;
  evidence_urls?: string[];
}

// ============ Fetch Utilities ============

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "PROOF-Integration/1.0",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Request timeout: ${url}`);
    } else {
      console.error(`Fetch error: ${error}`);
    }
    return null;
  }
}

// ============ Catalyst Explorer API ============

export async function fetchProposalFromExplorer(
  proposalId: string
): Promise<CatalystProposal | null> {
  const url = `${CATALYST_EXPLORER_API}/proposals/${proposalId}?include=fund,campaign,team`;
  const response = await fetchWithTimeout<{ data: CatalystProposal }>(url);
  return response?.data || null;
}

export async function searchProposals(
  query: string,
  options: {
    fundId?: string;
    status?: string;
    page?: number;
    perPage?: number;
  } = {}
): Promise<{ proposals: CatalystProposal[]; total: number; lastPage: number }> {
  const params = new URLSearchParams({
    search: query,
    page: String(options.page || 1),
    per_page: String(options.perPage || 20),
    include: "fund,campaign",
  });

  if (options.fundId) params.append("fund_id", options.fundId);
  if (options.status) params.append("status", options.status);

  const url = `${CATALYST_EXPLORER_API}/proposals?${params}`;
  const response = await fetchWithTimeout<{
    data: CatalystProposal[];
    meta: { total: number; last_page: number };
  }>(url);

  return {
    proposals: response?.data || [],
    total: response?.meta?.total || 0,
    lastPage: response?.meta?.last_page || 1,
  };
}

export async function fetchFundsFromExplorer(): Promise<
  Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    currency: string;
    amount: number;
  }>
> {
  const url = `${CATALYST_EXPLORER_API}/funds`;
  const response = await fetchWithTimeout<{
    data: Array<{
      id: string;
      title: string;
      slug: string;
      status: string;
      currency: string;
      amount: number;
    }>;
  }>(url);
  return response?.data || [];
}

// ============ Milestones API ============

export async function fetchMilestoneProject(
  projectId: number
): Promise<MilestoneProject | null> {
  const url = `${MILESTONES_API}/projects/${projectId}`;
  const response = await fetchWithTimeout<{ data: MilestoneProject }>(url);
  return response?.data || null;
}

export async function fetchProjectMilestones(
  projectId: number
): Promise<MilestoneDetail[]> {
  const url = `${MILESTONES_API}/projects/${projectId}/milestones`;
  const response = await fetchWithTimeout<{ data: MilestoneDetail[] }>(url);
  return response?.data || [];
}

export async function searchMilestoneProjects(
  options: {
    fundId?: number;
    status?: string;
    page?: number;
    perPage?: number;
  } = {}
): Promise<{ projects: MilestoneProject[]; total: number }> {
  const params = new URLSearchParams({
    page: String(options.page || 1),
    per_page: String(options.perPage || 50),
  });

  if (options.fundId) params.append("fund_id", String(options.fundId));
  if (options.status) params.append("status", options.status);

  const url = `${MILESTONES_API}/projects?${params}`;
  const response = await fetchWithTimeout<{
    data: MilestoneProject[];
    meta: { total: number };
  }>(url);

  return {
    projects: response?.data || [],
    total: response?.meta?.total || 0,
  };
}

// ============ URL Builders ============

export function buildProjectCatalystUrl(
  fundNumber: number,
  category: string,
  slug: string
): string {
  const categorySlug = category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `https://projectcatalyst.io/funds/${fundNumber}/${categorySlug}/${slug}`;
}

export function buildMilestonesUrl(projectId: string | number): string {
  return `https://milestones.projectcatalyst.io/projects/${projectId}`;
}

export function buildCatalystExplorerUrl(
  fundNumber: number,
  slug: string
): string {
  return `https://www.catalystexplorer.com/en/proposals/${slug}-f${fundNumber}/details`;
}

export function buildIdeaScaleUrl(proposalId: string): string {
  return `https://cardano.ideascale.com/c/idea/${proposalId}`;
}

// ============ Data Sync Utilities ============

export interface SyncResult {
  success: boolean;
  updated: number;
  errors: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export async function syncProjectFromExplorer(
  externalId: string,
  prisma: PrismaLike
): Promise<SyncResult> {
  const result: SyncResult = { success: false, updated: 0, errors: [] };

  try {
    const proposal = await fetchProposalFromExplorer(externalId);
    if (!proposal) {
      result.errors.push(`Proposal ${externalId} not found in Catalyst Explorer`);
      return result;
    }

    // Find project in database
    const project = await prisma.project.findFirst({
      where: { OR: [{ externalId }, { catalystId: externalId }] },
    });

    if (!project) {
      result.errors.push(`Project with external ID ${externalId} not found in database`);
      return result;
    }

    // Update project with fresh data
    await prisma.project.update({
      where: { id: project.id },
      data: {
        title: proposal.title,
        slug: proposal.slug,
        problem: proposal.problem,
        solution: proposal.solution,
        experience: proposal.experience,
        status: proposal.status,
        fundingStatus: proposal.funding_status || project.fundingStatus,
        fundingAmount: proposal.amount_requested,
        amountReceived: proposal.amount_received,
        yesVotes: proposal.yes_votes_count || 0,
        noVotes: proposal.no_votes_count || 0,
        website: proposal.website,
        explorerUrl: proposal.link,
        lastSeenAt: new Date(),
      },
    });

    result.success = true;
    result.updated = 1;
  } catch (error) {
    result.errors.push(`Sync error: ${error}`);
  }

  return result;
}

export async function syncMilestonesFromApi(
  catalystProjectId: number,
  prisma: PrismaLike
): Promise<SyncResult> {
  const result: SyncResult = { success: false, updated: 0, errors: [] };

  try {
    const milestones = await fetchProjectMilestones(catalystProjectId);
    if (milestones.length === 0) {
      result.errors.push(`No milestones found for project ${catalystProjectId}`);
      return result;
    }

    // Find project in database
    const project = await prisma.project.findFirst({
      where: { catalystId: String(catalystProjectId) },
    });

    if (!project) {
      result.errors.push(`Project with catalyst ID ${catalystProjectId} not found`);
      return result;
    }

    const now = new Date();

    for (const milestone of milestones) {
      const catalystMilestoneId = String(milestone.id);

      const existing = await prisma.milestone.findFirst({
        where: { catalystMilestoneId },
      });

      const data = {
        projectId: project.id,
        title: milestone.title || `Milestone ${milestone.milestone_number}`,
        description: milestone.description,
        milestoneNumber: milestone.milestone_number,
        status: milestone.status || "pending",
        catalystMilestoneId,
        somStatus: milestone.som_status,
        poaStatus: milestone.poa_status,
        paymentStatus: milestone.payment_status,
        somCost: milestone.cost,
        evidenceUrls: milestone.evidence_urls || [],
        sourceUrl: `${MILESTONES_API}/projects/${catalystProjectId}/milestones/${milestone.id}`,
        sourceType: "catalyst_milestones",
        lastSeenAt: now,
      };

      if (existing) {
        await prisma.milestone.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.milestone.create({
          data: {
            ...data,
            outputUrls: [],
            createdAt: now,
          },
        });
      }

      result.updated++;
    }

    // Update project milestone stats
    const allMilestones = await prisma.milestone.findMany({
      where: { projectId: project.id },
      select: { status: true },
    });

    await prisma.project.update({
      where: { id: project.id },
      data: {
        milestonesTotal: allMilestones.length,
        milestonesCompleted: allMilestones.filter((m: { status: string }) => m.status === "completed").length,
        milestonesInProgress: allMilestones.filter((m: { status: string }) => m.status === "in_progress").length,
        milestonesPending: allMilestones.filter((m: { status: string }) => m.status === "pending").length,
      },
    });

    result.success = true;
  } catch (error) {
    result.errors.push(`Sync error: ${error}`);
  }

  return result;
}
