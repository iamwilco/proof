import { NextRequest, NextResponse } from "next/server";

import prisma from "../../../../../lib/prisma";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { rateLimit } from "../../../../../lib/rateLimit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  if (rateLimit({ key: `review-votes:${ip}`, limit: 15, windowMs: 60_000 })) {
    console.warn("Rate limit exceeded", ip, "review-votes");
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { value?: number };
  if (typeof body.value !== "number" || ![1, -1].includes(body.value)) {
    return NextResponse.json({ error: "Value must be 1 or -1" }, { status: 400 });
  }

  const voteValue = body.value as 1 | -1;

  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    const vote = await tx.reviewVote.upsert({
      where: { reviewId_userId: { reviewId: review.id, userId: data.user.id } },
      create: { reviewId: review.id, userId: data.user.id, value: voteValue },
      update: { value: voteValue },
    });

    const voteCounts = await tx.reviewVote.groupBy({
      by: ["value"],
      where: { reviewId: review.id },
      _count: { value: true },
    });

    const helpfulCount = voteCounts.find((entry) => entry.value === 1)?._count.value ?? 0;
    const notHelpfulCount = voteCounts.find((entry) => entry.value === -1)?._count.value ?? 0;

    await tx.review.update({
      where: { id: review.id },
      data: { helpfulCount, notHelpfulCount },
    });

    return vote;
  });

  return NextResponse.json({ ok: true });
}
