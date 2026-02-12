import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { runAllDetectors, runDetector } from "../../../lib/flagDetection";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const projectId = searchParams.get("projectId");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (type) where.type = type;
  if (projectId) where.projectId = projectId;

  const [flags, total] = await Promise.all([
    prisma.flag.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            fund: { select: { name: true } },
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: [
        { severity: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.flag.count({ where }),
  ]);

  const stats = await prisma.flag.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return NextResponse.json({
    flags,
    total,
    limit,
    offset,
    stats: stats.reduce(
      (acc, s) => ({ ...acc, [s.status]: s._count._all }),
      {} as Record<string, number>
    ),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, category } = body;

  if (action === "run_detection") {
    if (category) {
      const validCategories = ["repeat_delays", "ghost_project", "overdue_milestone", "funding_cluster"];
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      const results = await runDetector(category);
      return NextResponse.json({ results, count: results.length });
    }

    const stats = await runAllDetectors();
    return NextResponse.json({
      message: "Detection complete",
      ...stats,
    });
  }

  // Create manual/community flag
  const { projectId, title, description, flagCategory, severity, evidenceUrl } = body;

  if (!projectId || !title || !description || !flagCategory) {
    return NextResponse.json(
      { error: "Missing required fields: projectId, title, description, flagCategory" },
      { status: 400 }
    );
  }

  const flag = await prisma.flag.create({
    data: {
      projectId,
      type: "community",
      category: flagCategory,
      severity: severity || "medium",
      status: "pending",
      title,
      description,
      evidenceUrl,
    },
  });

  return NextResponse.json(flag, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { flagId, status, reviewedBy } = body;

  if (!flagId || !status) {
    return NextResponse.json(
      { error: "Missing required fields: flagId, status" },
      { status: 400 }
    );
  }

  const validStatuses = ["pending", "confirmed", "dismissed", "resolved"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { status };
  
  if (status === "confirmed" || status === "dismissed") {
    updateData.reviewedAt = new Date();
    if (reviewedBy) updateData.reviewedBy = reviewedBy;
  }
  
  if (status === "resolved") {
    updateData.resolvedAt = new Date();
  }

  const flag = await prisma.flag.update({
    where: { id: flagId },
    data: updateData,
  });

  return NextResponse.json(flag);
}
