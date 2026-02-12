import { NextResponse } from "next/server";

import { sendAlert } from "../../../../lib/monitoring";

type ErrorPayload = {
  source: string;
  message: string;
  details?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ErrorPayload;

  if (!body.source || !body.message) {
    return NextResponse.json({ error: "Missing source or message" }, { status: 400 });
  }

  await sendAlert({
    title: `Error Reported: ${body.source}`,
    message: body.message,
    details: body.details,
  });

  return NextResponse.json({ status: "ok" });
}
