import { NextResponse } from "next/server";

import prisma from "../../../lib/prisma";

interface ReportPayload {
  projectId: string;
  month: number;
  year: number;
  reporterName: string;
  summary: string;
  progress?: string | null;
  blockers?: string | null;
  nextSteps?: string | null;
  evidenceUrls?: string[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const reports = await prisma.monthlyReport.findMany({
    where: { projectId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReportPayload;
  if (!body.projectId || !body.month || !body.year || !body.reporterName || !body.summary) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const report = await prisma.monthlyReport.create({
    data: {
      projectId: body.projectId,
      month: body.month,
      year: body.year,
      reporterName: body.reporterName,
      summary: body.summary,
      progress: body.progress ?? null,
      blockers: body.blockers ?? null,
      nextSteps: body.nextSteps ?? null,
      evidenceUrls: body.evidenceUrls ?? [],
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}
