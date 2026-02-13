import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

type DisputePayload = {
  scoreId: string;
  reason: string;
  evidence?: string | null;
};

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as DisputePayload;

    if (!body.scoreId || !body.reason) {
      return NextResponse.json({ error: "Missing scoreId or reason" }, { status: 400 });
    }

    const score = await prisma.accountabilityScore.findUnique({
      where: { id: body.scoreId },
      select: { id: true, status: true, personId: true },
    });

    if (!score) {
      return NextResponse.json({ error: "Score not found" }, { status: 404 });
    }

    if (score.status !== "preview") {
      return NextResponse.json({ error: "Score is not in preview" }, { status: 400 });
    }

    const existingDispute = await prisma.accountabilityScoreDispute.findFirst({
      where: {
        scoreId: body.scoreId,
        userId: session.user.id,
        status: "pending",
      },
    });

    if (existingDispute) {
      return NextResponse.json({ error: "Dispute already submitted" }, { status: 409 });
    }

    const dispute = await prisma.accountabilityScoreDispute.create({
      data: {
        scoreId: body.scoreId,
        userId: session.user.id,
        reason: body.reason,
        evidence: body.evidence ?? null,
      },
    });

    await prisma.accountabilityScore.update({
      where: { id: body.scoreId },
      data: { status: "disputed" },
    });

    await prisma.accountabilityNotification.create({
      data: {
        personId: score.personId,
        type: "score_dispute",
        payload: { disputeId: dispute.id },
      },
    });

    await prisma.accountabilityScoreAudit.create({
      data: {
        scoreId: score.id,
        action: "dispute_submitted",
        actorId: session.user.id,
        payload: { disputeId: dispute.id },
      },
    });

    return NextResponse.json({ dispute }, { status: 201 });
  } catch (error) {
    console.error("Dispute submission error:", error);
    return NextResponse.json({ error: "Failed to submit dispute" }, { status: 500 });
  }
}
