import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

type UpdatePayload = {
  status: "approved" | "rejected";
  notes?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as UpdatePayload;

    if (!body.status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const dispute = await prisma.accountabilityScoreDispute.findUnique({
      where: { id },
      include: { score: true },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const resolvedAt = new Date();
    await prisma.accountabilityScoreDispute.update({
      where: { id },
      data: {
        status: body.status,
        resolvedAt,
        resolvedBy: session.user.id,
      },
    });

    if (body.status === "approved") {
      await prisma.accountabilityScore.update({
        where: { id: dispute.scoreId },
        data: {
          status: "published",
          publishedAt: resolvedAt,
        },
      });
    } else {
      await prisma.accountabilityScore.update({
        where: { id: dispute.scoreId },
        data: { status: "preview" },
      });
    }

    await prisma.accountabilityScoreAudit.create({
      data: {
        scoreId: dispute.scoreId,
        action: "dispute_reviewed",
        actorId: session.user.id,
        payload: {
          disputeId: dispute.id,
          status: body.status,
          notes: body.notes ?? null,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Dispute review error:", error);
    return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 });
  }
}
