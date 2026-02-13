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
    });

    if (cachedScore) {
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
          calculatedAt: cachedScore.calculatedAt,
          cached: true,
        });
      }
    }

    // Calculate fresh score
    const result = await calculatePersonScore(id);

    return NextResponse.json({
      personId: id,
      score: result.score,
      badge: result.badge,
      breakdown: result.breakdown,
      confidence: result.confidence,
      dataPoints: result.dataPoints,
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
