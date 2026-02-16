#!/usr/bin/env npx ts-node
/**
 * Populate slugs and external URLs for existing projects
 * 
 * External link strategy:
 * - catalystUrl → milestones.projectcatalyst.io (official IOG Milestone Module)
 * - milestonesUrl → same as catalystUrl
 * - explorerUrl → null (PROOF replaces catalystexplorer.com)
 * 
 * Run: npx tsx scripts/populate-project-slugs.ts
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function main() {
  console.log("Populating project slugs and external URLs...\n");
  console.log("URL strategy:");
  console.log("  catalystUrl  → milestones.projectcatalyst.io (official IOG source)");
  console.log("  milestonesUrl → milestones.projectcatalyst.io");
  console.log("  explorerUrl  → null (PROOF replaces catalystexplorer.com)\n");

  // Get all projects
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      externalId: true,
      title: true,
      slug: true,
      catalystUrl: true,
      milestonesUrl: true,
      explorerUrl: true,
      fund: {
        select: { number: true },
      },
    },
  });

  console.log(`Found ${projects.length} projects to process\n`);

  let updated = 0;
  let skipped = 0;

  for (const project of projects) {
    const updates: Record<string, string | null> = {};

    // Generate slug if missing
    if (!project.slug && project.title) {
      const baseSlug = generateSlug(project.title);
      
      // Check for duplicates and add suffix if needed
      let slug = baseSlug;
      let suffix = 1;
      while (true) {
        const existing = await prisma.project.findFirst({
          where: { slug, id: { not: project.id } },
        });
        if (!existing) break;
        slug = `${baseSlug}-${suffix}`;
        suffix++;
      }
      updates.slug = slug;
    }

    // catalystUrl → milestones.projectcatalyst.io (official IOG Milestone Module)
    const officialUrl = project.externalId
      ? `https://milestones.projectcatalyst.io/projects/${project.externalId}`
      : null;

    if (project.catalystUrl !== officialUrl) {
      updates.catalystUrl = officialUrl;
    }

    // milestonesUrl → same as catalystUrl
    if (project.milestonesUrl !== officialUrl) {
      updates.milestonesUrl = officialUrl;
    }

    // explorerUrl → null (PROOF replaces catalystexplorer.com)
    if (project.explorerUrl !== null) {
      updates.explorerUrl = null;
    }

    // Update if there are changes
    if (Object.keys(updates).length > 0) {
      await prisma.project.update({
        where: { id: project.id },
        data: updates,
      });
      updated++;
      
      if (updated % 500 === 0) {
        console.log(`  Updated ${updated} projects...`);
      }
    } else {
      skipped++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (already complete): ${skipped}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
