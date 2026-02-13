/**
 * Recalculate Fund Statistics
 * Fixes incorrect totals without re-fetching all data
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function computeFundStats(): Promise<void> {
  console.log("Computing fund statistics...");

  const funds = await prisma.fund.findMany({ select: { id: true, name: true } });

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
        currency: "ADA",
      },
    });

    console.log(`  ${fund.name}: ${fundedStats._count} funded, ₳${fundedStats._sum.fundingAmount || 0} awarded`);
  }
}

async function run(): Promise<void> {
  console.log("=== Recalculating Statistics ===\n");

  try {
    await computeFundStats();
    console.log("\n✓ Statistics recalculated successfully");
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
