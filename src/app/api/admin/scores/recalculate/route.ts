import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { recalculateAllScores } from "@/lib/accountability";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await recalculateAllScores();
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Score recalculation error:", error);
    return NextResponse.json(
      { error: "Failed to recalculate scores" },
      { status: 500 }
    );
  }
}
