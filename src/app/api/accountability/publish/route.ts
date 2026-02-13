import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const scores = await prisma.accountabilityScore.findMany({
    where: {
      status: "preview",
      previewUntil: { lte: now },
    },
    select: { id: true, personId: true },
  });

  if (scores.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  await prisma.accountabilityScore.updateMany({
    where: { id: { in: scores.map((score) => score.id) } },
    data: { status: "published", publishedAt: now },
  });

  await prisma.accountabilityScoreAudit.createMany({
    data: scores.map((score) => ({
      scoreId: score.id,
      action: "score_published",
      payload: { reason: "preview_expired" },
    })),
  });

  return NextResponse.json({ published: scores.length });
}
