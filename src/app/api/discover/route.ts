import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fundParam = searchParams.get("fund"); // "all" or fund number

    // Build fund filter: default to latest fund (15), "all" disables filter
    const fundFilter: Record<string, unknown> = {};
    if (fundParam !== "all") {
      const fundNumber = fundParam ? parseInt(fundParam, 10) : 15;
      const fund = await prisma.fund.findFirst({
        where: { number: fundNumber },
        select: { id: true },
      });
      if (fund) {
        fundFilter.fundId = fund.id;
      }
    }

    // For the selected fund, check if there are any funded projects
    // If none (e.g. Fund 15 still in voting), show pending proposals instead
    let statusFilter: Record<string, unknown> = { fundingStatus: "funded" };
    if (fundFilter.fundId) {
      const fundedCount = await prisma.project.count({
        where: { fundId: fundFilter.fundId as string, fundingStatus: "funded" },
      });
      if (fundedCount === 0) {
        // Fund still in voting phase — show all proposals
        statusFilter = { fundingStatus: { in: ["pending", "funded"] } };
      }
    }

    const projects = await prisma.project.findMany({
      where: {
        ...statusFilter,
        ...fundFilter,
      },
      orderBy: [
        { yesVotes: "desc" },
        { createdAt: "desc" },
      ],
      take: 50,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fundingAmount: true,
        status: true,
        fund: {
          select: {
            name: true,
          },
        },
        projectPeople: {
          where: { isPrimary: true },
          select: {
            person: {
              select: {
                id: true,
                name: true,
                accountabilityScore: {
                  select: {
                    overallScore: true,
                    completionScore: true,
                    deliveryScore: true,
                    badge: true,
                  },
                },
                completedProposalsCount: true,
                fundedProposalsCount: true,
              },
            },
          },
          take: 1,
        },
        _count: {
          select: {
            flags: {
              where: { status: { in: ["pending", "confirmed"] } },
            },
          },
        },
      },
    });

    const normalized = projects.map((project) => {
      const primaryPerson = project.projectPeople[0]?.person;
      const accountability = primaryPerson?.accountabilityScore;
      const fundedProjects = primaryPerson?.fundedProposalsCount ?? 0;
      const completedProjects = primaryPerson?.completedProposalsCount ?? 0;
      const completionRate = fundedProjects > 0 ? Math.round((completedProjects / fundedProjects) * 100) : 0;

      return {
        ...project,
        fundingAmount: Number(project.fundingAmount),
        primaryPerson: primaryPerson
          ? {
              id: primaryPerson.id,
              name: primaryPerson.name,
              completionRate,
              accountabilityScore: accountability?.overallScore ?? null,
              onTimeDelivery: accountability?.deliveryScore ?? null,
              badge: accountability?.badge ?? null,
            }
          : null,
        flagCount: project._count.flags,
      };
    });

    const prioritized = normalized
      .sort((a, b) => {
        const scoreA = a.primaryPerson?.accountabilityScore ?? 0;
        const scoreB = b.primaryPerson?.accountabilityScore ?? 0;
        const flagsA = a.flagCount ?? 0;
        const flagsB = b.flagCount ?? 0;
        if (flagsA !== flagsB) return flagsA - flagsB;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return 0;
      })
      .slice(0, 40);

    // Shuffle for variety
    const shuffled = prioritized.sort(() => Math.random() - 0.5);

    return NextResponse.json({ projects: shuffled });
  } catch (error) {
    console.error("Discover API error:", error);
    return NextResponse.json({ projects: [] }, { status: 500 });
  }
}
