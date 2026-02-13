import prisma from "./prisma";

interface ReviewerData {
  userId: string;
  ideascaleId?: string;
  ideascaleUsername?: string;
  fundsParticipated: string[];
}

interface ModeratorData {
  userId: string;
  role: "moderator" | "senior_moderator" | "admin";
  scope: string[];
  appointedAt: Date;
  appointedBy?: string;
}

export async function linkReviewsToReviewers(): Promise<number> {
  // Get all reviews that don't have a reviewer profile
  const reviews = await prisma.review.findMany({
    where: { userId: { not: undefined } },
    select: { userId: true },
    distinct: ["userId"],
  });

  let created = 0;
  for (const review of reviews) {
    const existing = await prisma.reviewerProfile.findUnique({
      where: { userId: review.userId },
    });

    if (!existing) {
      // Get review stats for this user
      const stats = await prisma.review.aggregate({
        where: { userId: review.userId },
        _count: { _all: true },
        _avg: { rating: true },
      });

      // Get funds participated
      const fundReviews = await prisma.review.findMany({
        where: { userId: review.userId },
        select: { project: { select: { fundId: true } } },
        distinct: ["projectId"],
      });
      const fundIds = [...new Set(fundReviews.map((r) => r.project.fundId))];

      await prisma.reviewerProfile.create({
        data: {
          userId: review.userId,
          fundsParticipated: fundIds,
          proposalsReviewed: stats._count._all,
          averageScore: stats._avg.rating,
          isVeteran: fundIds.length >= 3,
          badges: fundIds.length >= 3 ? ["veteran"] : [],
        },
      });
      created++;
    }
  }

  return created;
}

export async function calculateReviewOutcomes(): Promise<number> {
  // Get all reviews with their proposal outcomes
  const reviews = await prisma.review.findMany({
    include: {
      project: {
        select: { status: true },
      },
    },
  });

  let updated = 0;
  for (const review of reviews) {
    const isFunded = review.project.status === "COMPLETED" || review.project.status === "IN_PROGRESS";
    void isFunded; // Track for future use
    const helpful = (review.helpfulCount || 0) > (review.notHelpfulCount || 0);

    // Update reviewer profile stats if needed
    const profile = await prisma.reviewerProfile.findUnique({
      where: { userId: review.userId },
    });

    if (profile) {
      const totalVotes = (review.helpfulCount || 0) + (review.notHelpfulCount || 0);
      if (totalVotes > 0 && !helpful) {
        // Increment flagged reviews if this review was deemed unhelpful
        await prisma.reviewerProfile.update({
          where: { userId: review.userId },
          data: { flaggedReviews: { increment: 1 } },
        });
        updated++;
      }
    }
  }

  return updated;
}

export async function updateReviewerStats(userId: string): Promise<void> {
  const stats = await prisma.review.aggregate({
    where: { userId },
    _count: { _all: true },
    _sum: { helpfulCount: true, notHelpfulCount: true },
  });

  const helpful = stats._sum.helpfulCount || 0;
  const notHelpful = stats._sum.notHelpfulCount || 0;
  const totalVotes = helpful + notHelpful;
  const qualityScore = totalVotes > 0 ? helpful / totalVotes : null;

  // Get funds participated
  const fundReviews = await prisma.review.findMany({
    where: { userId },
    select: { project: { select: { fundId: true } } },
    distinct: ["projectId"],
  });
  const fundIds = [...new Set(fundReviews.map((r) => r.project.fundId))];

  await prisma.reviewerProfile.upsert({
    where: { userId },
    update: {
      proposalsReviewed: stats._count._all,
      reviewQualityScore: qualityScore,
      fundsParticipated: fundIds,
      isVeteran: fundIds.length >= 3,
    },
    create: {
      userId,
      proposalsReviewed: stats._count._all,
      reviewQualityScore: qualityScore,
      fundsParticipated: fundIds,
      isVeteran: fundIds.length >= 3,
      badges: fundIds.length >= 3 ? ["veteran"] : [],
    },
  });
}

export async function createModeratorProfile(data: ModeratorData): Promise<string> {
  const profile = await prisma.moderatorProfile.create({
    data: {
      userId: data.userId,
      role: data.role,
      scope: data.scope,
      appointedAt: data.appointedAt,
      appointedBy: data.appointedBy,
      badges: [],
    },
  });

  return profile.id;
}

export async function recordModerationAction(
  userId: string,
  actionType: "flag_resolved" | "report_handled" | "warning_issued"
): Promise<void> {
  const updateData: Record<string, { increment: number }> = {
    actionsCount: { increment: 1 },
  };

  switch (actionType) {
    case "flag_resolved":
      updateData.flagsResolved = { increment: 1 };
      break;
    case "report_handled":
      updateData.reportsHandled = { increment: 1 };
      break;
    case "warning_issued":
      updateData.warningsIssued = { increment: 1 };
      break;
  }

  await prisma.moderatorProfile.update({
    where: { userId },
    data: updateData,
  });
}

export async function importReviewerFromIdeascale(
  userId: string,
  ideascaleId: string,
  ideascaleUsername: string
): Promise<void> {
  await prisma.reviewerProfile.upsert({
    where: { userId },
    update: {
      ideascaleId,
      ideascaleUsername,
    },
    create: {
      userId,
      ideascaleId,
      ideascaleUsername,
      fundsParticipated: [],
      badges: [],
    },
  });
}

export async function batchImportReviewers(reviewers: ReviewerData[]): Promise<number> {
  let imported = 0;

  for (const reviewer of reviewers) {
    try {
      await prisma.reviewerProfile.upsert({
        where: { userId: reviewer.userId },
        update: {
          ideascaleId: reviewer.ideascaleId,
          ideascaleUsername: reviewer.ideascaleUsername,
          fundsParticipated: reviewer.fundsParticipated,
          isVeteran: reviewer.fundsParticipated.length >= 3,
        },
        create: {
          userId: reviewer.userId,
          ideascaleId: reviewer.ideascaleId,
          ideascaleUsername: reviewer.ideascaleUsername,
          fundsParticipated: reviewer.fundsParticipated,
          isVeteran: reviewer.fundsParticipated.length >= 3,
          badges: reviewer.fundsParticipated.length >= 3 ? ["veteran"] : [],
        },
      });
      imported++;
    } catch (error) {
      console.error(`Failed to import reviewer ${reviewer.userId}:`, error);
    }
  }

  return imported;
}

export async function batchImportModerators(moderators: ModeratorData[]): Promise<number> {
  let imported = 0;

  for (const mod of moderators) {
    try {
      await prisma.moderatorProfile.upsert({
        where: { userId: mod.userId },
        update: {
          role: mod.role,
          scope: mod.scope,
        },
        create: {
          userId: mod.userId,
          role: mod.role,
          scope: mod.scope,
          appointedAt: mod.appointedAt,
          appointedBy: mod.appointedBy,
          badges: [],
        },
      });
      imported++;
    } catch (error) {
      console.error(`Failed to import moderator ${mod.userId}:`, error);
    }
  }

  return imported;
}

export async function getReviewerLeaderboard(limit = 50): Promise<Array<{
  userId: string;
  displayName: string;
  proposalsReviewed: number;
  qualityScore: number | null;
  fundsCount: number;
  badges: string[];
}>> {
  const profiles = await prisma.reviewerProfile.findMany({
    where: { isActive: true },
    orderBy: { proposalsReviewed: "desc" },
    take: limit,
    include: {
      user: { select: { displayName: true, walletAddress: true } },
    },
  });

  return profiles.map((p) => ({
    userId: p.userId,
    displayName: p.user.displayName || p.user.walletAddress || "Anonymous",
    proposalsReviewed: p.proposalsReviewed,
    qualityScore: p.reviewQualityScore ? Number(p.reviewQualityScore) : null,
    fundsCount: p.fundsParticipated.length,
    badges: p.badges,
  }));
}

export async function getModeratorDirectory(): Promise<Array<{
  userId: string;
  displayName: string;
  role: string;
  scope: string[];
  isActive: boolean;
  actionsCount: number;
}>> {
  const profiles = await prisma.moderatorProfile.findMany({
    orderBy: [{ isActive: "desc" }, { role: "asc" }],
    include: {
      user: { select: { displayName: true, walletAddress: true } },
    },
  });

  return profiles.map((p) => ({
    userId: p.userId,
    displayName: p.user.displayName || p.user.walletAddress || "Anonymous",
    role: p.role,
    scope: p.scope,
    isActive: p.isActive,
    actionsCount: p.actionsCount,
  }));
}
