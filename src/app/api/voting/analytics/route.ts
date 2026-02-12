import { NextRequest, NextResponse } from "next/server";

import prisma from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fundId = searchParams.get("fundId");

  const whereClause = fundId ? { fundId } : {};

  const [records, funds, categoryStats] = await Promise.all([
    prisma.votingRecord.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, title: true } },
        fund: { select: { id: true, name: true, number: true } },
      },
      orderBy: { yesVotes: "desc" },
      take: 100,
    }),
    prisma.fund.findMany({
      select: { id: true, name: true, number: true },
      orderBy: { number: "desc" },
    }),
    prisma.votingRecord.groupBy({
      by: ["category"],
      where: whereClause,
      _sum: { yesVotes: true, noVotes: true, abstainVotes: true },
      _count: { _all: true },
      _avg: { approvalRate: true },
    }),
  ]);

  const totalYes = records.reduce((sum, r) => sum + r.yesVotes, 0);
  const totalNo = records.reduce((sum, r) => sum + r.noVotes, 0);
  const totalAbstain = records.reduce((sum, r) => sum + r.abstainVotes, 0);
  const avgApproval =
    records.length > 0
      ? records.reduce((sum, r) => sum + r.approvalRate, 0) / records.length
      : 0;

  return NextResponse.json({
    summary: {
      totalProposals: records.length,
      totalYesVotes: totalYes,
      totalNoVotes: totalNo,
      totalAbstainVotes: totalAbstain,
      averageApprovalRate: avgApproval,
    },
    funds,
    categoryBreakdown: categoryStats.map((cat) => ({
      category: cat.category,
      proposalCount: cat._count._all,
      yesVotes: cat._sum.yesVotes ?? 0,
      noVotes: cat._sum.noVotes ?? 0,
      abstainVotes: cat._sum.abstainVotes ?? 0,
      avgApprovalRate: cat._avg.approvalRate ?? 0,
    })),
    topProposals: records.slice(0, 20).map((r) => ({
      id: r.id,
      projectId: r.projectId,
      projectTitle: r.project.title,
      fundName: r.fund.name,
      category: r.category,
      yesVotes: r.yesVotes,
      noVotes: r.noVotes,
      approvalRate: r.approvalRate,
      fundRank: r.fundRank,
      categoryRank: r.categoryRank,
    })),
  });
}
