import { NextResponse } from "next/server";

import prisma from "../../../lib/prisma";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { rateLimit } from "../../../lib/rateLimit";

const DEFAULT_LIMIT = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Math.min(Number(searchParams.get("limit") ?? DEFAULT_LIMIT), 50);

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const skip = (Math.max(page, 1) - 1) * limit;

  const [reviews, total, averages] = await Promise.all([
    prisma.review.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, displayName: true, walletAddress: true } },
      },
    }),
    prisma.review.count({ where: { projectId } }),
    prisma.review.aggregate({
      where: { projectId },
      _avg: {
        rating: true,
        alignmentScore: true,
        feasibilityScore: true,
        auditabilityScore: true,
      },
    }),
  ]);

  return NextResponse.json({
    reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    averages: averages._avg,
  });
}

type ReviewPayload = {
  projectId: string;
  rating: number;
  title: string;
  content: string;
  alignmentScore?: number | null;
  feasibilityScore?: number | null;
  auditabilityScore?: number | null;
};

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  if (rateLimit({ key: `reviews:${ip}`, limit: 6, windowMs: 60_000 })) {
    console.warn("Rate limit exceeded", ip, "reviews");
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ReviewPayload;
  if (!body.projectId || !body.rating || !body.title || !body.content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      projectId: body.projectId,
      rating: body.rating,
      title: body.title,
      content: body.content,
      alignmentScore: body.alignmentScore ?? null,
      feasibilityScore: body.feasibilityScore ?? null,
      auditabilityScore: body.auditabilityScore ?? null,
      userId: data.user.id,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
