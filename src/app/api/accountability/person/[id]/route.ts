import { NextRequest, NextResponse } from "next/server";

import prisma from "../../../../../lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const score = await prisma.accountabilityScore.findUnique({
    where: { personId: id },
    include: { person: { select: { id: true, name: true } } },
  });

  if (!score) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ score });
}
