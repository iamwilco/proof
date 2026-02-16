#!/usr/bin/env npx tsx
/**
 * Backfill fundingAmountUSD and amountReceivedUSD for ADA-denominated funds (F10-F15)
 * using per-fund historical ADA/USD rates from FUND_HISTORICAL_RATES.
 * 
 * Run: npx tsx scripts/backfill-usd-amounts.ts
 */

import { PrismaClient } from "../src/generated/prisma";
import { FUND_HISTORICAL_RATES, normalizeToUSD, getFundCurrency } from "../src/lib/currency";

const prisma = new PrismaClient();

async function main() {
  console.log("Backfilling USD amounts with per-fund historical ADA/USD rates...\n");
  console.log("Rates:");
  for (const [fund, rate] of Object.entries(FUND_HISTORICAL_RATES)) {
    console.log(`  F${fund}: $${rate}/ADA`);
  }
  console.log();

  // Get all ADA-denominated funds (F10+)
  const funds = await prisma.fund.findMany({
    where: { number: { gte: 10 } },
    select: { id: true, number: true, name: true },
    orderBy: { number: "asc" },
  });

  let totalUpdated = 0;

  for (const fund of funds) {
    const rate = FUND_HISTORICAL_RATES[fund.number];
    if (!rate) {
      console.log(`  F${fund.number}: No rate defined, skipping`);
      continue;
    }

    // Get all projects in this fund
    const projects = await prisma.project.findMany({
      where: { fundId: fund.id },
      select: {
        id: true,
        fundingAmount: true,
        amountReceived: true,
        fundingAmountUSD: true,
        amountReceivedUSD: true,
        currency: true,
      },
    });

    let fundUpdated = 0;

    for (const project of projects) {
      const currency = project.currency || getFundCurrency(fund.number);
      if (currency === "USD") continue;

      const fundingAmt = Number(project.fundingAmount);
      const receivedAmt = Number(project.amountReceived);
      const newFundingUSD = normalizeToUSD(fundingAmt, fund.number, currency);
      const newReceivedUSD = normalizeToUSD(receivedAmt, fund.number, currency);

      // Only update if values differ
      const currentFundingUSD = Number(project.fundingAmountUSD);
      const currentReceivedUSD = Number(project.amountReceivedUSD);
      if (
        currentFundingUSD !== newFundingUSD ||
        currentReceivedUSD !== newReceivedUSD
      ) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            fundingAmountUSD: newFundingUSD,
            amountReceivedUSD: newReceivedUSD,
          },
        });
        fundUpdated++;
      }
    }

    console.log(`  F${fund.number} (${fund.name}): ${fundUpdated}/${projects.length} projects updated at $${rate}/ADA`);
    totalUpdated += fundUpdated;
  }

  // Verify totals
  console.log(`\nTotal projects updated: ${totalUpdated}`);
  console.log("\nVerification — sample per fund:");
  for (const fund of funds) {
    const sample = await prisma.project.findFirst({
      where: { fundId: fund.id, fundingAmount: { gt: 0 } },
      select: { title: true, fundingAmount: true, fundingAmountUSD: true, currency: true },
    });
    if (sample) {
      const impliedRate = Number(sample.fundingAmountUSD) / Number(sample.fundingAmount);
      console.log(`  F${fund.number}: ${sample.fundingAmount} ADA → $${sample.fundingAmountUSD} USD (rate: $${impliedRate.toFixed(4)}/ADA)`);
    }
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
