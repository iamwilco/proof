import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        fundingStatus: "funded",
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
