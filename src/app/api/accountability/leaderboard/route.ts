import { NextResponse } from "next/server";

import prisma from "../../../../lib/prisma";

export async function GET() {
  const leaderboard = await prisma.accountabilityScore.findMany({
    orderBy: { overallScore: "desc" },
    take: 100,
    include: { person: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ leaderboard });
}
