import { NextResponse } from "next/server";

import prisma from "../../../lib/prisma";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { rateLimit } from "../../../lib/rateLimit";

type RatingPayload = {
  projectId: string;
  score: number;
  comment?: string;
};

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  if (rateLimit({ key: `ratings:${ip}`, limit: 10, windowMs: 60_000 })) {
    console.warn("Rate limit exceeded", ip, "ratings");
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as RatingPayload;

  if (!body.projectId || !body.score) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const rating = await prisma.rating.create({
    data: {
      projectId: body.projectId,
      score: body.score,
      comment: body.comment ?? null,
      userId: data.user.id,
    },
  });

  return NextResponse.json({ rating });
}
