import { NextResponse } from "next/server";

import prisma from "../../../lib/prisma";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { rateLimit } from "../../../lib/rateLimit";

type ClaimPayload = {
  projectId: string;
};

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  if (rateLimit({ key: `claims:${ip}`, limit: 5, windowMs: 60_000 })) {
    console.warn("Rate limit exceeded", ip, "claims");
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ClaimPayload;
  if (!body.projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const claim = await prisma.projectClaim.create({
    data: {
      projectId: body.projectId,
      userId: data.user.id,
    },
  });

  return NextResponse.json({ claim });
}
