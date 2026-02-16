#!/usr/bin/env npx tsx
/**
 * PROOF-130: Catalyst Explorer single-proposal enrichment
 * 
 * Fetches detailed data from /proposals/{id} for each project with an externalId.
 * Extracts: GitHub URLs, impact, feasibility, team, budget, reviewer scores,
 * website, ideascaleId, projectDuration, opensourced.
 * 
 * Rate-limited to respect API limits (200ms between requests).
 * 
 * Run: npx tsx scripts/enrich-proposals.ts [--fund N] [--limit N] [--dry-run]
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
const API_BASE = "https://www.catalystexplorer.com/api/v1";
const DELAY_MS = 200; // Rate limit: 5 req/sec

// --- GitHub URL extraction ---

const GITHUB_REGEX = /https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9._-]+))?/g;

interface GitHubInfo {
  url: string;
  owner: string;
  repo: string | null;
}

function extractGitHubUrls(texts: (string | null | undefined)[]): GitHubInfo[] {
  const seen = new Set<string>();
  const results: GitHubInfo[] = [];

  for (const text of texts) {
    if (!text) continue;
    for (const match of text.matchAll(GITHUB_REGEX)) {
      const owner = match[1];
      const repo = match[2] || null;
      // Skip GitHub profile pages and common non-repo paths
      if (["topics", "explore", "settings", "notifications", "sponsors"].includes(owner)) continue;
      
      const url = repo
        ? `https://github.com/${owner}/${repo}`
        : `https://github.com/${owner}`;
      
      if (!seen.has(url)) {
        seen.add(url);
        results.push({ url, owner, repo });
      }
    }
  }

  return results;
}

// --- API fetching ---

interface ProposalDetail {
  data: {
    id: string;
    title: string;
    problem: string | null;
    solution: string | null;
    experience: string | null;
    project_details: {
      solution: string | null;
      impact: string | null;
      feasibility: string | null;
      outputs: string | null;
    } | null;
    pitch: {
      team: string | null;
      budget: string | null;
      value: string | null;
      resources: string | null;
    } | null;
    category_questions: Record<string, string | null> | null;
    theme: { group: string | null; tag: string | null } | null;
    website: string | null;
    quickpitch: string | null;
    project_length: number | null;
    opensourced: boolean | null;
    alignment_score: string | null;
    feasibility_score: string | null;
    auditability_score: string | null;
    ideascale_id: string | null;
    link: string | null;
  };
}

async function fetchProposalDetail(externalId: string): Promise<ProposalDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/proposals/${externalId}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`  HTTP ${res.status} for ${externalId}`);
      return null;
    }
    return (await res.json()) as ProposalDetail;
  } catch (err) {
    console.error(`  Fetch error for ${externalId}:`, err);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const fundFilter = args.includes("--fund") ? parseInt(args[args.indexOf("--fund") + 1]) : null;
  const limitArg = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : null;
  const dryRun = args.includes("--dry-run");
  const skipEnriched = args.includes("--skip-enriched");

  console.log("PROOF-130: Catalyst Explorer single-proposal enrichment");
  console.log(`  Fund filter: ${fundFilter ?? "all"}`);
  console.log(`  Limit: ${limitArg ?? "none"}`);
  console.log(`  Dry run: ${dryRun}`);
  console.log(`  Skip enriched: ${skipEnriched}`);
  console.log(`  Rate limit: ${DELAY_MS}ms between requests`);
  console.log();

  // Get projects to enrich
  const where: Record<string, unknown> = {
    externalId: { not: null },
  };
  if (skipEnriched) {
    where.alignmentScore = null;
  }
  if (fundFilter) {
    where.fund = { number: fundFilter };
  }

  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      externalId: true,
      title: true,
      githubUrl: true,
      website: true,
      ideascaleId: true,
      impact: true,
      projectDuration: true,
      fund: { select: { number: true } },
    },
    orderBy: { createdAt: "asc" },
    take: limitArg ?? undefined,
  });

  console.log(`Found ${projects.length} projects to enrich\n`);

  let enriched = 0;
  let githubFound = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const externalId = project.externalId!;

    if (i > 0 && i % 100 === 0) {
      console.log(`  Processed ${i}/${projects.length} — enriched: ${enriched}, github: ${githubFound}, errors: ${errors}`);
    }

    await sleep(DELAY_MS);

    const detail = await fetchProposalDetail(externalId);
    if (!detail) {
      errors++;
      continue;
    }

    const d = detail.data;
    const pd = d.project_details;
    const pitch = d.pitch;

    // Collect all text fields for GitHub URL extraction
    const allText = [
      d.problem,
      d.solution,
      d.experience,
      pd?.solution,
      pd?.impact,
      pd?.feasibility,
      pd?.outputs,
      pitch?.team,
      pitch?.budget,
      pitch?.value,
      pitch?.resources,
      d.website,
      ...(d.category_questions ? Object.values(d.category_questions) : []),
    ];

    const githubInfos = extractGitHubUrls(allText);
    // Pick the first repo URL, or first profile URL
    const bestGithub = githubInfos.find((g) => g.repo) || githubInfos[0] || null;

    // Parse reviewer scores
    const alignmentScore = d.alignment_score ? parseFloat(d.alignment_score) : null;
    const feasibilityScore = d.feasibility_score ? parseFloat(d.feasibility_score) : null;
    const auditabilityScore = d.auditability_score ? parseFloat(d.auditability_score) : null;

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Rich text fields — only set if we have new data and field is currently empty
    if (pd?.impact && !project.impact) updateData.impact = pd.impact;
    if (pd?.feasibility) updateData.feasibility = pd.feasibility;
    if (pitch?.team) updateData.teamDescription = pitch.team;
    if (pitch?.budget) updateData.budgetBreakdown = pitch.budget;

    // Structured fields
    if (d.website && !project.website) updateData.website = d.website;
    if (d.ideascale_id && !project.ideascaleId) updateData.ideascaleId = d.ideascale_id;
    if (d.project_length && !project.projectDuration) updateData.projectDuration = d.project_length;
    if (d.opensourced !== null) updateData.opensourced = d.opensourced;

    // Reviewer scores
    if (alignmentScore && !isNaN(alignmentScore)) updateData.alignmentScore = alignmentScore;
    if (feasibilityScore && !isNaN(feasibilityScore)) updateData.feasibilityScore = feasibilityScore;
    if (auditabilityScore && !isNaN(auditabilityScore)) updateData.auditabilityScore = auditabilityScore;

    // GitHub URL
    if (bestGithub && !project.githubUrl) {
      updateData.githubUrl = bestGithub.url;
      updateData.githubOwner = bestGithub.owner;
      if (bestGithub.repo) updateData.githubRepo = bestGithub.repo;
      githubFound++;
    }

    // Use richer solution from detail if available and current is short
    if (pd?.solution && pd.solution.length > 100) {
      updateData.solution = pd.solution;
    }

    if (Object.keys(updateData).length === 0) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await prisma.project.update({
        where: { id: project.id },
        data: updateData,
      });
    }

    enriched++;
  }

  console.log(`\nDone!`);
  console.log(`  Total processed: ${projects.length}`);
  console.log(`  Enriched: ${enriched}`);
  console.log(`  GitHub URLs found: ${githubFound}`);
  console.log(`  Skipped (no new data): ${skipped}`);
  console.log(`  Errors: ${errors}`);

  if (dryRun) {
    console.log("\n  (Dry run — no changes written to database)");
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
