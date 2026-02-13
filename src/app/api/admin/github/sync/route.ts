import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { syncAllProjectsGitHub } from "@/lib/github";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  const result = await syncAllProjectsGitHub(50, token);

  return NextResponse.json({ ...result });
}
