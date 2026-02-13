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
      },
    });

    // Shuffle for variety
    const shuffled = projects
      .map((p) => ({ ...p, fundingAmount: Number(p.fundingAmount) }))
      .sort(() => Math.random() - 0.5);

    return NextResponse.json({ projects: shuffled });
  } catch (error) {
    console.error("Discover API error:", error);
    return NextResponse.json({ projects: [] }, { status: 500 });
  }
}
