import prisma from "./prisma";

// ROI Calculation Weights
// Community reviews added as 15% weight, redistributed from other components
const WEIGHTS = {
  github: 0.30,
  deliverables: 0.30,
  onchain: 0.25,
  community: 0.15,
};

// Normalization constants
const GITHUB_MAX_SCORE = 100;
const FUNDING_NORMALIZATION_FACTOR = 10000; // $10k baseline

interface ROIBreakdown {
  github: {
    stars: number;
    forks: number;
    contributors: number;
    activityScore: number;
    weight: number;
    score: number;
  };
  deliverables: {
    completed: number;
    total: number;
    onTimeRate: number;
    weight: number;
    score: number;
  };
  onchain: {
    txCount: number;
    uniqueAddresses: number;
    totalReceived: number;
    weight: number;
    score: number;
  };
  community: {
    reviewCount: number;
    avgRating: number;
    weight: number;
    score: number;
  };
  outcome: {
    score: number;
  };
  roi: {
    fundingAmount: number;
    normalizedFunding: number;
    score: number;
  };
}

function calculateGitHubScore(project: {
  githubStars: number | null;
  githubForks: number | null;
  githubContributors: number | null;
  githubActivityScore: number | null;
}): number {
  if (!project.githubActivityScore && !project.githubStars) {
    return 0;
  }

  // Activity score is already 0-100, use it as base
  const activityScore = project.githubActivityScore ?? 0;
  
  // Add bonuses for community engagement (stars, forks, contributors)
  const starsBonus = Math.min((project.githubStars ?? 0) / 100, 20); // Max 20 points
  const forksBonus = Math.min((project.githubForks ?? 0) / 20, 15); // Max 15 points
  const contributorsBonus = Math.min((project.githubContributors ?? 0) * 2, 15); // Max 15 points

  const rawScore = activityScore * 0.5 + starsBonus + forksBonus + contributorsBonus;
  return Math.min(rawScore, GITHUB_MAX_SCORE);
}

async function calculateDeliverableScore(projectId: string): Promise<{
  score: number;
  completed: number;
  total: number;
  onTimeRate: number;
}> {
  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    select: {
      status: true,
      dueDate: true,
      poaApprovedAt: true,
    },
  });

  if (milestones.length === 0) {
    return { score: 0, completed: 0, total: 0, onTimeRate: 0 };
  }

  const completed = milestones.filter(
    (m) => m.status === "completed" || m.status === "approved"
  ).length;
  const total = milestones.length;
  const completionRate = completed / total;

  // Calculate on-time rate
  let onTimeCount = 0;
  let countableOnTime = 0;
  for (const m of milestones) {
    if (m.poaApprovedAt && m.dueDate) {
      countableOnTime++;
      if (m.poaApprovedAt <= m.dueDate) {
        onTimeCount++;
      }
    }
  }
  const onTimeRate = countableOnTime > 0 ? onTimeCount / countableOnTime : 1;

  // Score: 70% completion rate + 30% on-time rate
  const score = (completionRate * 70 + onTimeRate * 30);

  return { score, completed, total, onTimeRate };
}

function calculateOnchainScore(project: {
  onchainTxCount: number | null;
  onchainUniqueAddresses: number | null;
  onchainTotalReceived: unknown;
}): number {
  if (!project.onchainTxCount && !project.onchainUniqueAddresses) {
    return 0;
  }

  const txCount = project.onchainTxCount ?? 0;
  const uniqueAddresses = project.onchainUniqueAddresses ?? 0;
  const totalReceived = Number(project.onchainTotalReceived ?? 0);

  // Score components
  const txScore = Math.min(txCount / 10, 40); // Max 40 points for 100+ txs
  const addressScore = Math.min(uniqueAddresses / 5, 30); // Max 30 points for 50+ addresses
  const volumeScore = Math.min(totalReceived / 10000, 30); // Max 30 points for 10k+ ADA

  return Math.min(txScore + addressScore + volumeScore, 100);
}

/**
 * Calculate community review score from project reviews
 * Returns score 0-100 based on average rating and review count
 */
async function calculateCommunityScore(projectId: string): Promise<{
  score: number;
  reviewCount: number;
  avgRating: number;
}> {
  const reviews = await prisma.review.findMany({
    where: { projectId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return { score: 0, reviewCount: 0, avgRating: 0 };
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  // Convert 1-5 rating to 0-100 scale
  // 1 star = 0, 5 stars = 100
  const ratingScore = ((avgRating - 1) / 4) * 100;
  
  // Bonus for having more reviews (up to 20 points for 10+ reviews)
  const reviewCountBonus = Math.min(reviews.length * 2, 20);
  
  // Final score: 80% rating + 20% review count bonus
  const score = Math.min(ratingScore * 0.8 + reviewCountBonus, 100);

  return { score, reviewCount: reviews.length, avgRating };
}

function calculateROIScore(outcomeScore: number, fundingAmount: number): number {
  if (fundingAmount <= 0) return 0;

  // Normalize funding to $10k baseline
  const normalizedFunding = fundingAmount / FUNDING_NORMALIZATION_FACTOR;
  
  // ROI = outcome / normalized_funding
  // Higher outcome with lower funding = higher ROI
  const rawROI = outcomeScore / Math.max(normalizedFunding, 0.1);

  // Cap at 100 for display purposes
  return Math.min(rawROI, 100);
}

export interface ProjectROIResult {
  projectId: string;
  githubScore: number;
  deliverableScore: number;
  onchainScore: number;
  communityScore: number;
  outcomeScore: number;
  fundingAmount: number;
  roiScore: number;
  breakdown: ROIBreakdown;
}

export async function calculateProjectROI(projectId: string): Promise<ProjectROIResult | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      fundingAmount: true,
      githubStars: true,
      githubForks: true,
      githubContributors: true,
      githubActivityScore: true,
      onchainTxCount: true,
      onchainUniqueAddresses: true,
      onchainTotalReceived: true,
    },
  });

  if (!project) return null;

  const fundingAmount = Number(project.fundingAmount);
  
  // Calculate component scores
  const githubScore = calculateGitHubScore(project);
  const deliverableData = await calculateDeliverableScore(projectId);
  const onchainScore = calculateOnchainScore(project);
  const communityData = await calculateCommunityScore(projectId);

  // Weighted outcome score (includes community reviews)
  const outcomeScore =
    githubScore * WEIGHTS.github +
    deliverableData.score * WEIGHTS.deliverables +
    onchainScore * WEIGHTS.onchain +
    communityData.score * WEIGHTS.community;

  // Calculate ROI
  const roiScore = calculateROIScore(outcomeScore, fundingAmount);

  const breakdown: ROIBreakdown = {
    github: {
      stars: project.githubStars ?? 0,
      forks: project.githubForks ?? 0,
      contributors: project.githubContributors ?? 0,
      activityScore: project.githubActivityScore ?? 0,
      weight: WEIGHTS.github,
      score: githubScore,
    },
    deliverables: {
      completed: deliverableData.completed,
      total: deliverableData.total,
      onTimeRate: deliverableData.onTimeRate,
      weight: WEIGHTS.deliverables,
      score: deliverableData.score,
    },
    onchain: {
      txCount: project.onchainTxCount ?? 0,
      uniqueAddresses: project.onchainUniqueAddresses ?? 0,
      totalReceived: Number(project.onchainTotalReceived ?? 0),
      weight: WEIGHTS.onchain,
      score: onchainScore,
    },
    community: {
      reviewCount: communityData.reviewCount,
      avgRating: communityData.avgRating,
      weight: WEIGHTS.community,
      score: communityData.score,
    },
    outcome: {
      score: outcomeScore,
    },
    roi: {
      fundingAmount,
      normalizedFunding: fundingAmount / FUNDING_NORMALIZATION_FACTOR,
      score: roiScore,
    },
  };

  return {
    projectId,
    githubScore,
    deliverableScore: deliverableData.score,
    onchainScore,
    communityScore: communityData.score,
    outcomeScore,
    fundingAmount,
    roiScore,
    breakdown,
  };
}

export async function storeProjectROI(result: ProjectROIResult): Promise<void> {
  await prisma.projectROI.create({
    data: {
      projectId: result.projectId,
      githubScore: result.githubScore,
      deliverableScore: result.deliverableScore,
      onchainScore: result.onchainScore,
      communityScore: result.communityScore,
      outcomeScore: result.outcomeScore,
      fundingAmount: result.fundingAmount,
      roiScore: result.roiScore,
      breakdown: JSON.parse(JSON.stringify(result.breakdown)),
    },
  });
}

export async function calculateCategoryPercentiles(): Promise<void> {
  // Get all projects grouped by category with their latest ROI
  const projects = await prisma.project.findMany({
    where: {
      roiScores: { some: {} },
    },
    select: {
      id: true,
      category: true,
      roiScores: {
        orderBy: { calculatedAt: "desc" },
        take: 1,
      },
    },
  });

  // Group by category
  const byCategory: Record<string, { id: string; roiScore: number }[]> = {};
  const allScores: { id: string; roiScore: number }[] = [];

  for (const project of projects) {
    const latestROI = project.roiScores[0];
    if (!latestROI) continue;

    const entry = { id: latestROI.id, roiScore: latestROI.roiScore };
    allScores.push(entry);

    if (!byCategory[project.category]) {
      byCategory[project.category] = [];
    }
    byCategory[project.category].push(entry);
  }

  // Calculate overall percentiles
  allScores.sort((a, b) => a.roiScore - b.roiScore);
  for (let i = 0; i < allScores.length; i++) {
    const percentile = ((i + 1) / allScores.length) * 100;
    await prisma.projectROI.update({
      where: { id: allScores[i].id },
      data: { overallPercentile: percentile },
    });
  }

  // Calculate category percentiles
  for (const category of Object.keys(byCategory)) {
    const categoryScores = byCategory[category];
    categoryScores.sort((a, b) => a.roiScore - b.roiScore);

    for (let i = 0; i < categoryScores.length; i++) {
      const percentile = ((i + 1) / categoryScores.length) * 100;
      await prisma.projectROI.update({
        where: { id: categoryScores[i].id },
        data: { categoryPercentile: percentile },
      });
    }
  }
}

export async function recalculateAllROI(
  limit: number = 100
): Promise<{ calculated: number; errors: number }> {
  const projects = await prisma.project.findMany({
    where: {
      status: { in: ["completed", "in_progress", "funded"] },
    },
    select: { id: true },
    take: limit,
  });

  let calculated = 0;
  let errors = 0;

  for (const project of projects) {
    try {
      const result = await calculateProjectROI(project.id);
      if (result) {
        await storeProjectROI(result);
        calculated++;
      }
    } catch (error) {
      console.error(`Error calculating ROI for ${project.id}:`, error);
      errors++;
    }
  }

  // Update percentiles after all calculations
  if (calculated > 0) {
    await calculateCategoryPercentiles();
  }

  return { calculated, errors };
}

export async function getProjectROI(projectId: string) {
  return prisma.projectROI.findFirst({
    where: { projectId },
    orderBy: { calculatedAt: "desc" },
  });
}

export async function getTopPerformers(limit: number = 10) {
  return prisma.projectROI.findMany({
    where: { overallPercentile: { gte: 90 } },
    orderBy: { roiScore: "desc" },
    take: limit,
    include: {
      project: {
        select: {
          id: true,
          title: true,
          category: true,
          fundingAmount: true,
        },
      },
    },
  });
}

export async function getBottomPerformers(limit: number = 10) {
  return prisma.projectROI.findMany({
    where: { overallPercentile: { lte: 10 } },
    orderBy: { roiScore: "asc" },
    take: limit,
    include: {
      project: {
        select: {
          id: true,
          title: true,
          category: true,
          fundingAmount: true,
        },
      },
    },
  });
}
