import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { runAllDetectors } from "@/lib/flagDetection";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAllDetectors();

  return NextResponse.json({
    message: "Automated flag detection complete",
    created: result.created,
    skipped: result.skipped,
    byCategory: result.byCategory,
    errors: result.errors,
  });
}
