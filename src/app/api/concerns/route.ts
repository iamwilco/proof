import { NextResponse } from "next/server";

import prisma from "../../../lib/prisma";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { rateLimit } from "../../../lib/rateLimit";

type ConcernPayload = {
  projectId: string;
  category: string;
  description: string;
  evidenceUrl?: string | null;
};

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  if (rateLimit({ key: `concerns:${ip}`, limit: 6, windowMs: 60_000 })) {
    console.warn("Rate limit exceeded", ip, "concerns");
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ConcernPayload;

  if (!body.projectId || !body.category || !body.description) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const concern = await prisma.concern.create({
    data: {
      projectId: body.projectId,
      category: body.category,
      description: body.description,
      evidenceUrl: body.evidenceUrl ?? null,
      userId: data.user.id,
    },
  });

  await prisma.notification.create({
    data: {
      projectId: body.projectId,
      concernId: concern.id,
      type: "concern_submitted",
      payload: { category: body.category },
    },
  });

  return NextResponse.json({ concern });
}
