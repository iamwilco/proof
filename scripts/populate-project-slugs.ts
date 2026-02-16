#!/usr/bin/env npx ts-node
/**
 * Populate slugs and external URLs for existing projects
 * Run: npx ts-node scripts/populate-project-slugs.ts
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

    // Generate milestones URL if missing but externalId exists
    if (!project.milestonesUrl && project.externalId) {
      updates.milestonesUrl = `https://milestones.projectcatalyst.io/projects/${project.externalId}`;
    }

    // Generate explorer URL if missing but slug exists
    const finalSlug = updates.slug || project.slug;
    if (!project.explorerUrl && finalSlug) {
      updates.explorerUrl = `https://www.catalystexplorer.com/proposals/${finalSlug}`;
    }

    // Update if there are changes
    if (Object.keys(updates).length > 0) {
      await prisma.project.update({
        where: { id: project.id },
        data: updates,
      });
      updated++;
      
      if (updated % 100 === 0) {
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
