import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { recalculateAllROI } from "@/lib/roi";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await recalculateAllROI(100);

  return NextResponse.json({
    calculated: result.calculated,
    errors: result.errors,
  });
}
