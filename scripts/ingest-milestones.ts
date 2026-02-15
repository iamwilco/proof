/**
 * Catalyst Milestones Ingestion Script
 * Fetches milestone data from milestones.projectcatalyst.io
 * Updates project milestone counts and individual milestone records
 */

import { PrismaClient } from "../src/generated/prisma";

const MILESTONES_API = "https://milestones.projectcatalyst.io/api";
const RATE_LIMIT_MS = 500;
const MAX_PROJECTS = parseInt(process.env.INGEST_MAX_PROJECTS || "0", 10) || Infinity;

const prisma = new PrismaClient({});

// ============ Type Definitions ============

interface MilestoneProject {
  id: number;
  project_id: number;
  title: string;
  slug: string;
  status: string;
  budget: number;
  currency: string;
  milestones_qty: number;
  milestones_completed: number;
  fund?: {
    id: number;
    title: string;
  };
}

interface MilestoneDetail {
  id: number;
  project_id: number;
  milestone_number: number;
  title: string;
  description?: string;
  status: string;
  cost?: number;
  currency?: string;
  delivery_month?: string;
  // SoM fields
  som_status?: string;
  som_submitted_at?: string;
  som_approved_at?: string;
  som_content?: string;
  // PoA fields
  poa_status?: string;
  poa_submitted_at?: string;
  poa_approved_at?: string;
  poa_content?: string;
  // Review
  reviewer_feedback?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  // Payment
  payment_status?: string;
  payment_amount?: number;
  payment_tx_hash?: string;
  payment_date?: string;
  // Evidence
  evidence_urls?: string[];
  output_urls?: string[];
}

interface ProjectsResponse {
  data: MilestoneProject[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

interface MilestonesResponse {
  data: MilestoneDetail[];
}

// ============ Utilities ============

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(url: string, retries = 3): Promise<T | null> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "PROOF-Milestones-Ingestion/1.0",
        },
      });
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (attempt >= retries) {
        console.warn(`  Failed after ${retries} attempts: ${error}`);
        return null;
      }
      const wait = Math.pow(1.5, attempt) * 1000;
      console.warn(`  Retry ${attempt}/${retries} in ${wait}ms: ${error}`);
      await sleep(wait);
    }
  }
}

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// ============ Data Fetching ============

async function* fetchAllProjects(): AsyncGenerator<MilestoneProject> {
  let page = 1;
  let processed = 0;

  while (true) {
    const url = `${MILESTONES_API}/projects?page=${page}&per_page=50`;
    console.log(`Fetching projects page ${page}...`);

    const response = await fetchWithRetry<ProjectsResponse>(url);
    if (!response || !response.data || response.data.length === 0) break;

    const lastPage = response.meta?.last_page || 1;
    console.log(`  Got ${response.data.length} projects (page ${page}/${lastPage})`);

    for (const project of response.data) {
      yield project;
      processed++;
      if (processed >= MAX_PROJECTS) return;
    }

    if (page >= lastPage) break;
    page++;
    await sleep(RATE_LIMIT_MS);
  }
}

async function fetchProjectMilestones(projectId: number): Promise<MilestoneDetail[]> {
  const url = `${MILESTONES_API}/projects/${projectId}/milestones`;
  const response = await fetchWithRetry<MilestonesResponse>(url);
  return response?.data || [];
}

// ============ Database Operations ============

async function findProjectByCatalystId(catalystId: number): Promise<string | null> {
  // Try to find by catalystId first
  let project = await prisma.project.findFirst({
    where: { catalystId: String(catalystId) },
    select: { id: true },
  });
  
  if (project) return project.id;

  // Try by externalId (some projects use this)
  project = await prisma.project.findFirst({
    where: { externalId: String(catalystId) },
    select: { id: true },
  });

  return project?.id || null;
}

async function upsertMilestone(
  projectId: string,
  milestone: MilestoneDetail
): Promise<void> {
  const now = new Date();
  const catalystMilestoneId = String(milestone.id);

  const data = {
    projectId,
    title: milestone.title || `Milestone ${milestone.milestone_number}`,
    description: milestone.description || null,
    milestoneNumber: milestone.milestone_number,
    dueDate: parseDate(milestone.delivery_month),
    completedAt: milestone.status === "completed" ? parseDate(milestone.poa_approved_at) : null,
    status: milestone.status || "pending",
    catalystMilestoneId,
    // SoM
    somStatus: milestone.som_status || null,
    somSubmittedAt: parseDate(milestone.som_submitted_at),
    somApprovedAt: parseDate(milestone.som_approved_at),
    somContent: milestone.som_content || null,
    somCost: milestone.cost || null,
    // PoA
    poaStatus: milestone.poa_status || null,
    poaSubmittedAt: parseDate(milestone.poa_submitted_at),
    poaApprovedAt: parseDate(milestone.poa_approved_at),
    poaContent: milestone.poa_content || null,
    // Review
    reviewerFeedback: milestone.reviewer_feedback || null,
    reviewerName: milestone.reviewer_name || null,
    reviewedAt: parseDate(milestone.reviewed_at),
    // Payment
    paymentStatus: milestone.payment_status || null,
    paymentAmount: milestone.payment_amount || null,
    paymentTxHash: milestone.payment_tx_hash || null,
    paymentDate: parseDate(milestone.payment_date),
    // Evidence
    evidenceUrls: milestone.evidence_urls || [],
    outputUrls: milestone.output_urls || [],
    // Meta
    sourceUrl: `${MILESTONES_API}/projects/${milestone.project_id}/milestones/${milestone.id}`,
    sourceType: "catalyst_milestones",
    lastSeenAt: now,
  };

  // Find existing milestone
  const existing = await prisma.milestone.findFirst({
    where: { catalystMilestoneId },
    select: { id: true },
  });

  if (existing) {
    await prisma.milestone.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.milestone.create({
      data: {
        ...data,
        createdAt: now,
      },
    });
  }
}

async function updateProjectMilestoneStats(projectId: string): Promise<void> {
  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    select: { status: true, poaApprovedAt: true },
  });

  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === "completed").length;
  const inProgress = milestones.filter((m) => m.status === "in_progress").length;
  const pending = milestones.filter((m) => m.status === "pending").length;

  // Find last milestone activity
  const lastMilestone = milestones
    .filter((m) => m.poaApprovedAt)
    .sort((a, b) => (b.poaApprovedAt?.getTime() || 0) - (a.poaApprovedAt?.getTime() || 0))[0];

  await prisma.project.update({
    where: { id: projectId },
    data: {
      milestonesTotal: total,
      milestonesCompleted: completed,
      milestonesInProgress: inProgress,
      milestonesPending: pending,
      lastMilestoneAt: lastMilestone?.poaApprovedAt || null,
      milestonesUrl: `https://milestones.projectcatalyst.io/projects/${projectId}`,
    },
  });
}

// ============ Main ============

async function run(): Promise<void> {
  console.log("=== Catalyst Milestones Ingestion ===");
  console.log(`API: ${MILESTONES_API}`);
  console.log(`Max projects: ${MAX_PROJECTS === Infinity ? "unlimited" : MAX_PROJECTS}\n`);

  let projectsProcessed = 0;
  let milestonesProcessed = 0;
  let projectsNotFound = 0;

  try {
    for await (const milestoneProject of fetchAllProjects()) {
      // Find matching project in our database
      const projectId = await findProjectByCatalystId(milestoneProject.project_id);

      if (!projectId) {
        projectsNotFound++;
        continue;
      }

      // Update project with catalyst ID and milestone URL
      await prisma.project.update({
        where: { id: projectId },
        data: {
          catalystId: String(milestoneProject.project_id),
          milestonesUrl: `https://milestones.projectcatalyst.io/projects/${milestoneProject.id}`,
        },
      });

      // Fetch and upsert milestones
      const milestones = await fetchProjectMilestones(milestoneProject.id);
      
      for (const milestone of milestones) {
        await upsertMilestone(projectId, milestone);
        milestonesProcessed++;
      }

      // Update project milestone stats
      await updateProjectMilestoneStats(projectId);

      projectsProcessed++;
      if (projectsProcessed % 50 === 0) {
        console.log(`  Processed ${projectsProcessed} projects, ${milestonesProcessed} milestones...`);
      }

      await sleep(RATE_LIMIT_MS);
    }

    console.log("\n=== Milestones Ingestion Complete ===");
    console.log(`Projects processed: ${projectsProcessed}`);
    console.log(`Projects not found in DB: ${projectsNotFound}`);
    console.log(`Milestones upserted: ${milestonesProcessed}`);

  } catch (error) {
    console.error("Milestones ingestion failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
