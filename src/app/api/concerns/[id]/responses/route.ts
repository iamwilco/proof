import { NextRequest, NextResponse } from "next/server";

import prisma from "../../../../../lib/prisma";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { rateLimit } from "../../../../../lib/rateLimit";

type ResponsePayload = {
  message: string;
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  if (rateLimit({ key: `responses:${ip}`, limit: 8, windowMs: 60_000 })) {
    console.warn("Rate limit exceeded", ip, "responses");
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ResponsePayload;
  if (!body.message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const concern = await prisma.concern.findUnique({
    where: { id },
    select: { id: true, projectId: true },
  });

  if (!concern) {
    return NextResponse.json({ error: "Concern not found" }, { status: 404 });
  }

  const response = await prisma.concernResponse.create({
    data: {
      concernId: concern.id,
      message: body.message,
      userId: data.user.id,
    },
  });

  await prisma.notification.create({
    data: {
      projectId: concern.projectId,
      concernId: concern.id,
      type: "concern_response",
      payload: { message: body.message },
    },
  });

  return NextResponse.json({ response });
}
