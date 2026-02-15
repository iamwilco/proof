/**
 * Catalyst Milestones Ingestion Script
 * Reads milestone data from a JSON file (milestones.projectcatalyst.io has no public API)
 * Updates project milestone counts and individual milestone records
 * 
 * Usage: npx tsx scripts/ingest-milestones.ts --payload ./data/milestones.json
 */

import { PrismaClient } from "../src/generated/prisma";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient({});

// ============ Type Definitions ============

interface MilestoneRecord {
  // Project linking
  project_external_id: string;
  milestone_id?: string;
  catalyst_milestone_id?: string;
  // Milestone details
  title: string;
  description?: string;
  milestone_number?: number;
  due_date?: string;
  status?: string;
  cost?: number;
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
  // Source
  source_url?: string;
  source_type?: string;
}

// ============ Utilities ============

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function loadPayload(filePath: string): MilestoneRecord[] {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Payload file not found: ${absolutePath}`);
  }
  const content = fs.readFileSync(absolutePath, "utf-8");
  const data = JSON.parse(content);
  if (!Array.isArray(data)) {
    throw new Error("Payload must be an array of milestone records");
  }
  return data as MilestoneRecord[];
}

// ============ Database Operations ============

async function buildProjectLookup(): Promise<Map<string, string>> {
  const lookup = new Map<string, string>();
  const projects = await prisma.project.findMany({
    select: { id: true, externalId: true, catalystId: true },
  });
  for (const p of projects) {
    if (p.externalId) lookup.set(p.externalId, p.id);
    if (p.catalystId) lookup.set(p.catalystId, p.id);
  }
  return lookup;
}

async function findExistingMilestone(
  projectId: string,
  record: MilestoneRecord
): Promise<string | null> {
  // Try by catalyst_milestone_id first
  if (record.catalyst_milestone_id) {
    const existing = await prisma.milestone.findFirst({
      where: { catalystMilestoneId: record.catalyst_milestone_id },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  // Try by title + due date
  const dueDate = parseDate(record.due_date);
  const existing = await prisma.milestone.findFirst({
    where: {
      projectId,
      title: record.title,
      ...(dueDate ? { dueDate } : {}),
    },
    select: { id: true },
  });
  return existing?.id || null;
}

async function upsertMilestone(
  projectId: string,
  record: MilestoneRecord,
  index: number
): Promise<{ inserted: boolean }> {
  const now = new Date();

  const data = {
    projectId,
    title: record.title || `Milestone ${record.milestone_number || index + 1}`,
    description: record.description || null,
    milestoneNumber: record.milestone_number || null,
    dueDate: parseDate(record.due_date),
    completedAt: record.status === "completed" ? parseDate(record.poa_approved_at) : null,
    status: record.status || "pending",
    catalystMilestoneId: record.catalyst_milestone_id || null,
    // SoM
    somStatus: record.som_status || null,
    somSubmittedAt: parseDate(record.som_submitted_at),
    somApprovedAt: parseDate(record.som_approved_at),
    somContent: record.som_content || null,
    somCost: record.cost || null,
    // PoA
    poaStatus: record.poa_status || null,
    poaSubmittedAt: parseDate(record.poa_submitted_at),
    poaApprovedAt: parseDate(record.poa_approved_at),
    poaContent: record.poa_content || null,
    // Review
    reviewerFeedback: record.reviewer_feedback || null,
    reviewerName: record.reviewer_name || null,
    reviewedAt: parseDate(record.reviewed_at),
    // Payment
    paymentStatus: record.payment_status || null,
    paymentAmount: record.payment_amount || null,
    paymentTxHash: record.payment_tx_hash || null,
    paymentDate: parseDate(record.payment_date),
    // Evidence
    evidenceUrls: record.evidence_urls || [],
    outputUrls: record.output_urls || [],
    // Meta
    sourceUrl: record.source_url || "manual",
    sourceType: record.source_type || "catalyst_milestone_manual",
    lastSeenAt: now,
  };

  const existingId = await findExistingMilestone(projectId, record);

  if (existingId) {
    await prisma.milestone.update({
      where: { id: existingId },
      data: { ...data, updatedAt: now },
    });
    return { inserted: false };
  } else {
    await prisma.milestone.create({
      data: { ...data, createdAt: now },
    });
    return { inserted: true };
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
    },
  });
}

// ============ Main ============

async function run(payloadPath: string): Promise<void> {
  console.log("=== Catalyst Milestones Ingestion ===");
  console.log(`Payload: ${payloadPath}\n`);

  const records = loadPayload(payloadPath);
  console.log(`Loaded ${records.length} milestone records\n`);

  const projectLookup = await buildProjectLookup();
  console.log(`Built lookup for ${projectLookup.size} project IDs\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const processedProjects = new Set<string>();

  try {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const externalId = record.project_external_id;

      if (!externalId) {
        console.warn(`Skipping record ${i}: missing project_external_id`);
        skipped++;
        continue;
      }

      const projectId = projectLookup.get(externalId);
      if (!projectId) {
        skipped++;
        continue;
      }

      const result = await upsertMilestone(projectId, record, i);
      if (result.inserted) {
        inserted++;
      } else {
        updated++;
      }

      processedProjects.add(projectId);

      if ((inserted + updated) % 100 === 0) {
        console.log(`  Progress: ${inserted} inserted, ${updated} updated...`);
      }
    }

    // Update milestone stats for all affected projects
    console.log(`\nUpdating stats for ${processedProjects.size} projects...`);
    for (const projectId of processedProjects) {
      await updateProjectMilestoneStats(projectId);
    }

    console.log("\n=== Milestones Ingestion Complete ===");
    console.log(`Inserted: ${inserted}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Projects affected: ${processedProjects.size}`);

  } catch (error) {
    console.error("Milestones ingestion failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let payloadPath = "";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--payload" && args[i + 1]) {
    payloadPath = args[i + 1];
    break;
  }
}

if (!payloadPath) {
  console.error("Usage: npx tsx scripts/ingest-milestones.ts --payload <path-to-json>");
  console.error("\nExample JSON format:");
  console.error(JSON.stringify([
    {
      project_external_id: "12345",
      catalyst_milestone_id: "m-001",
      title: "Milestone 1",
      milestone_number: 1,
      status: "completed",
      due_date: "2024-03-01",
      som_status: "approved",
      poa_status: "approved",
    }
  ], null, 2));
  process.exit(1);
}

run(payloadPath).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
