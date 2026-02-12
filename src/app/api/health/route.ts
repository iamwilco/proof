import { NextResponse } from "next/server";

import prisma from "../../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startedAt;

    return NextResponse.json({
      status: "ok",
      dbLatencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Database unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
