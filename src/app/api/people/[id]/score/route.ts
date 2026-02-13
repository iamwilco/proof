import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePersonScore } from "@/lib/accountability";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First check if we have a cached score
    const cachedScore = await prisma.accountabilityScore.findUnique({
      where: { personId: id },
      include: { disputes: { where: { status: "pending" } } },
    });

    if (cachedScore) {
      if (
        cachedScore.status === "preview" &&
        cachedScore.previewUntil &&
        cachedScore.previewUntil <= new Date() &&
        cachedScore.disputes.length === 0
      ) {
        const publishedAt = new Date();
        await prisma.accountabilityScore.update({
          where: { personId: id },
          data: { status: "published", publishedAt },
        });
        await prisma.accountabilityScoreAudit.create({
          data: {
            score: { connect: { personId: id } },
            action: "score_published",
            payload: { reason: "preview_expired" },
          },
        });
        cachedScore.status = "published";
      }

      // Check if score is recent (< 24 hours old)
      const hoursSinceCalc = (Date.now() - cachedScore.calculatedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCalc < 24) {
        return NextResponse.json({
          personId: id,
          score: cachedScore.overallScore,
          badge: cachedScore.badge,
          breakdown: {
            completion: cachedScore.completionScore,
            delivery: cachedScore.deliveryScore,
            community: cachedScore.communityScore,
            efficiency: cachedScore.efficiencyScore,
            communication: cachedScore.communicationScore,
          },
          status: cachedScore.status,
          previewUntil: cachedScore.previewUntil,
          calculatedAt: cachedScore.calculatedAt,
          cached: true,
        });
      }
    }

    // Calculate fresh score
    const result = await calculatePersonScore(id);

    const previewUntil = new Date(result.calculatedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    return NextResponse.json({
      personId: id,
      score: result.score,
      badge: result.badge,
      breakdown: result.breakdown,
      confidence: result.confidence,
      dataPoints: result.dataPoints,
      status: "preview",
      previewUntil,
      calculatedAt: result.calculatedAt,
      cached: false,
    });
  } catch (error) {
    console.error("Score calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate score" },
      { status: 500 }
    );
  }
}
