import { NextResponse } from "next/server";

import { sendAlert } from "../../../../lib/monitoring";

type EtlAlertPayload = {
  job: string;
  status: "ok" | "error";
  message?: string;
  details?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as EtlAlertPayload;

  if (!body.job || !body.status) {
    return NextResponse.json({ error: "Missing job or status" }, { status: 400 });
  }

  if (body.status === "error") {
    await sendAlert({
      title: `ETL Failure: ${body.job}`,
      message: body.message ?? "ETL job reported an error",
      details: body.details,
    });
  }

  return NextResponse.json({ status: "ok" });
}
