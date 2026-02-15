import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeDecimalToUSD, formatUSD, getNormalizationInfo } from "@/lib/currency";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        projectPeople: {
          include: { project: { include: { fund: true } } },
        },
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const projects = person.projectPeople.map((pp) => ({
      ...pp.project,
      isPrimary: pp.isPrimary,
      role: pp.role,
    }));

    let totalRequestedUSD = 0;
    let totalReceivedUSD = 0;
    let fundedCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let primaryCount = 0;
    let contributorCount = 0;

    interface FundBreakdown {
      fundId: string;
      fundName: string;
      fundNumber: number;
      proposalsCount: number;
      fundedCount: number;
      completedCount: number;
      totalRequestedUSD: number;
      totalReceivedUSD: number;
      currency: string;
    }

    const fundMap = new Map<string, FundBreakdown>();

    for (const project of projects) {
      const fund = project.fund;
      const fundNumber = fund?.number || 0;
      const currency = project.currency || "USD";

      const requestedUSD = normalizeDecimalToUSD(project.fundingAmount, fundNumber, currency);
      const receivedUSD = normalizeDecimalToUSD(project.amountReceived, fundNumber, currency);

      totalRequestedUSD += requestedUSD;
      totalReceivedUSD += receivedUSD;

      if (project.fundingStatus === "funded") fundedCount++;
      if (project.status === "complete") completedCount++;
      if (project.status === "in_progress") inProgressCount++;
      if (project.isPrimary) primaryCount++;
      else contributorCount++;

      if (fund) {
        const existing = fundMap.get(fund.id);
        if (existing) {
          existing.proposalsCount++;
          existing.totalRequestedUSD += requestedUSD;
          existing.totalReceivedUSD += receivedUSD;
          if (project.fundingStatus === "funded") existing.fundedCount++;
          if (project.status === "complete") existing.completedCount++;
        } else {
          fundMap.set(fund.id, {
            fundId: fund.id,
            fundName: fund.name,
            fundNumber: fund.number,
            proposalsCount: 1,
            fundedCount: project.fundingStatus === "funded" ? 1 : 0,
            completedCount: project.status === "complete" ? 1 : 0,
            totalRequestedUSD: requestedUSD,
            totalReceivedUSD: receivedUSD,
            currency: fund.currency || currency,
          });
        }
      }
    }

    const byFund = Array.from(fundMap.values()).sort((a, b) => b.fundNumber - a.fundNumber);
    const completionRate = fundedCount > 0 ? Math.round((completedCount / fundedCount) * 100) : 0;
    const fundingSuccessRate = projects.length > 0 ? Math.round((fundedCount / projects.length) * 100) : 0;

    return NextResponse.json({
      personId: id,
      name: person.name,
      username: person.username,
      totals: {
        proposalsCount: projects.length,
        fundedCount,
        completedCount,
        inProgressCount,
        totalRequestedUSD: Math.round(totalRequestedUSD),
        totalReceivedUSD: Math.round(totalReceivedUSD),
        totalRequestedFormatted: formatUSD(totalRequestedUSD),
        totalReceivedFormatted: formatUSD(totalReceivedUSD),
        completionRate,
        fundingSuccessRate,
      },
      byFund,
      roles: { primary: primaryCount, contributor: contributorCount },
      normalization: getNormalizationInfo(),
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Aggregates error:", error);
    return NextResponse.json({ error: "Failed to calculate aggregates" }, { status: 500 });
  }
}
