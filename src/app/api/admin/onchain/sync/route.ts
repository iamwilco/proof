import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { syncAllProjectsOnchain } from "@/lib/blockfrost";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncAllProjectsOnchain(50);

  return NextResponse.json({
    synced: result.synced,
    errors: result.errors,
    results: result.results,
  });
}
