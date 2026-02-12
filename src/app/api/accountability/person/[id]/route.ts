import { NextResponse } from "next/server";

import prisma from "../../../../../lib/prisma";

type Params = {
  params: { id: string };
};

export async function GET(_: Request, { params }: Params) {
  const score = await prisma.accountabilityScore.findUnique({
    where: { personId: params.id },
    include: { person: { select: { id: true, name: true } } },
  });

  if (!score) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ score });
}
