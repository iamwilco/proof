import { NextResponse } from "next/server";

import prisma from "../../../../lib/prisma";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const tierForScore = (score: number) => {
  if (score >= 100) return "platinum";
  if (score >= 50) return "gold";
  if (score >= 20) return "silver";
  return "bronze";
};

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const concerns = await prisma.concern.findMany({
    where: { userId: data.user.id },
    select: { status: true },
  });

  const approvedCount = concerns.filter((c) => c.status === "approved").length;
  const rejectedCount = concerns.filter((c) => c.status === "rejected").length;
  const score = approvedCount * 10 + rejectedCount * -5;
  const tier = tierForScore(score);

  const reputation = await prisma.$transaction(async (tx) => {
    const record = await tx.reputation.upsert({
      where: { userId: data.user.id },
      create: { userId: data.user.id, score, tier },
      update: { score, tier },
    });

    await tx.reputationEvent.deleteMany({ where: { userId: data.user.id } });

    const events = [];
    if (approvedCount > 0) {
      events.push({
        reputationId: record.id,
        userId: data.user.id,
        change: approvedCount * 10,
        reason: `Approved concerns: ${approvedCount}`,
      });
    }
    if (rejectedCount > 0) {
      events.push({
        reputationId: record.id,
        userId: data.user.id,
        change: rejectedCount * -5,
        reason: `Rejected concerns: ${rejectedCount}`,
      });
    }

    if (events.length > 0) {
      await tx.reputationEvent.createMany({ data: events });
    }

    return record;
  });

  return NextResponse.json({ reputation });
}
