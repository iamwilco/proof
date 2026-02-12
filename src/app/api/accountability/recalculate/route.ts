import { NextResponse } from "next/server";

import prisma from "../../../../lib/prisma";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const badgeForScore = (score: number) => {
  if (score >= 80) return "trusted";
  if (score >= 60) return "reliable";
  if (score >= 40) return "unproven";
  return "concerning";
};

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const people = await prisma.person.findMany({
    select: {
      id: true,
      fundedProposalsCount: true,
      completedProposalsCount: true,
      totalAmountAwarded: true,
      totalAmountReceived: true,
    },
  });

  const results = [] as Array<{ personId: string; overallScore: number }>

  for (const person of people) {
    const completionRate = person.fundedProposalsCount > 0
      ? person.completedProposalsCount / person.fundedProposalsCount
      : 0;
    const completionScore = clampScore(Math.round(completionRate * 100));

    const deliveryScore = 0;

    const ratingAggregate = await prisma.review.aggregate({
      _avg: { rating: true },
      where: { project: { projectPeople: { some: { personId: person.id } } } },
    });
    const communityScore = clampScore(
      Math.round(((ratingAggregate._avg.rating ?? 0) / 5) * 100)
    );

    const amountAwarded = Number(person.totalAmountAwarded);
    const amountReceived = Number(person.totalAmountReceived);
    const efficiencyScore = amountAwarded > 0
      ? clampScore(Math.round((amountReceived / amountAwarded) * 100))
      : 0;

    const communicationScore = 0;

    const overallScore = clampScore(
      Math.round(
        completionScore * 0.4
          + deliveryScore * 0.2
          + communityScore * 0.2
          + efficiencyScore * 0.1
          + communicationScore * 0.1
      )
    );

    const badge = badgeForScore(overallScore);

    await prisma.accountabilityScore.upsert({
      where: { personId: person.id },
      create: {
        personId: person.id,
        overallScore,
        completionScore,
        deliveryScore,
        communityScore,
        efficiencyScore,
        communicationScore,
        badge,
      },
      update: {
        overallScore,
        completionScore,
        deliveryScore,
        communityScore,
        efficiencyScore,
        communicationScore,
        badge,
        calculatedAt: new Date(),
      },
    });

    results.push({ personId: person.id, overallScore });
  }

  return NextResponse.json({ updated: results.length, results });
}
