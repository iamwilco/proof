import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const entityType = searchParams.get("entityType"); // UNKNOWN, INDIVIDUAL, ORGANIZATION
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 50;

  const where: Record<string, unknown> = {};
  if (entityType && entityType !== "all") {
    where.entityType = entityType;
  }
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [people, total] = await Promise.all([
    prisma.person.findMany({
      where,
      select: {
        id: true,
        name: true,
        entityType: true,
        proposalsCount: true,
        fundedProposalsCount: true,
        completedProposalsCount: true,
        organizations: {
          select: {
            organization: { select: { id: true, name: true } },
            role: true,
          },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.person.count({ where }),
  ]);

  return NextResponse.json({ people, total, page, totalPages: Math.ceil(total / limit) });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { personId, entityType, organizationId, role } = body;

  if (!personId) {
    return NextResponse.json({ error: "personId required" }, { status: 400 });
  }

  // Update entity type
  if (entityType) {
    if (!["UNKNOWN", "INDIVIDUAL", "ORGANIZATION"].includes(entityType)) {
      return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
    }
    await prisma.person.update({
      where: { id: personId },
      data: { entityType },
    });
  }

  // Link person to organization
  if (organizationId) {
    await prisma.personOrganization.upsert({
      where: {
        personId_organizationId: { personId, organizationId },
      },
      create: { personId, organizationId, role: role || null },
      update: { role: role || null },
    });
  }

  return NextResponse.json({ success: true });
}
