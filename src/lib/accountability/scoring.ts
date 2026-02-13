/**
 * Person Accountability Scoring Engine
 * 
 * Calculates accountability scores (0-100) based on weighted factors:
 * - Completion Rate (35%): Completed / Total Funded proposals
 * - On-Time Delivery (20%): Milestones delivered ≤ due date
 * - Milestone Quality (15%): PoA accepted on first submission
 * - Communication (15%): Monthly reports submitted regularly
 * - Community Rating (10%): Average review score
 * - Response Rate (5%): Responses to concerns/flags
 */

import { prisma } from "@/lib/prisma";

export interface ScoreBreakdown {
  completionRate: { value: number; weight: number; contribution: number };
  onTimeDelivery: { value: number; weight: number; contribution: number };
  milestoneQuality: { value: number; weight: number; contribution: number };
  communication: { value: number; weight: number; contribution: number };
  communityRating: { value: number; weight: number; contribution: number };
  responseRate: { value: number; weight: number; contribution: number };
}

export interface AccountabilityResult {
  personId: string;
  score: number;
  badge: "TRUSTED" | "RELIABLE" | "UNPROVEN" | "CONCERNING";
  breakdown: ScoreBreakdown;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  dataPoints: number;
  flagImpact: FlagImpact;
  calculatedAt: Date;
}

export interface OrganizationAccountabilityResult {
  organizationId: string;
  score: number;
  badge: "TRUSTED" | "RELIABLE" | "UNPROVEN" | "CONCERNING";
  calculatedAt: Date;
}

const WEIGHTS = {
  completionRate: 0.35,
  onTimeDelivery: 0.20,
  milestoneQuality: 0.15,
  communication: 0.15,
  communityRating: 0.10,
  responseRate: 0.05,
};

// Flag severity penalties (deducted from final score)
const FLAG_PENALTIES: Record<string, number> = {
  low: 3,
  medium: 7,
  high: 15,
  critical: 25,
};

export interface FlagImpact {
  totalPenalty: number;
  confirmedFlags: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
}

/**
 * Calculate flag penalty for a person based on confirmed flags on their projects
 */
export async function calculateFlagPenalty(personId: string): Promise<FlagImpact> {
  const projectIds = await prisma.projectPerson.findMany({
    where: { personId },
    select: { projectId: true },
  });

  const confirmedFlags = await prisma.flag.findMany({
    where: {
      projectId: { in: projectIds.map(p => p.projectId) },
      status: "confirmed",
    },
    select: {
      severity: true,
      category: true,
    },
  });

  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let totalPenalty = 0;

  for (const flag of confirmedFlags) {
    const penalty = FLAG_PENALTIES[flag.severity] || FLAG_PENALTIES.medium;
    totalPenalty += penalty;

    byCategory[flag.category] = (byCategory[flag.category] || 0) + 1;
    bySeverity[flag.severity] = (bySeverity[flag.severity] || 0) + 1;
  }

  // Cap total penalty at 50 points to prevent complete score destruction
  totalPenalty = Math.min(totalPenalty, 50);

  return {
    totalPenalty,
    confirmedFlags: confirmedFlags.length,
    byCategory,
    bySeverity,
  };
}

function getBadge(score: number): AccountabilityResult["badge"] {
  if (score >= 80) return "TRUSTED";
  if (score >= 60) return "RELIABLE";
  if (score >= 40) return "UNPROVEN";
  return "CONCERNING";
}

function getConfidence(dataPoints: number): AccountabilityResult["confidence"] {
  if (dataPoints >= 10) return "HIGH";
  if (dataPoints >= 3) return "MEDIUM";
  return "LOW";
}

/**
 * Calculate completion rate: completed projects / total funded projects
 */
async function calculateCompletionRate(personId: string): Promise<{ rate: number; total: number; completed: number }> {
  const projects = await prisma.projectPerson.findMany({
    where: { personId },
    include: {
      project: {
        select: {
          status: true,
          fundingStatus: true,
        },
      },
    },
  });

  const funded = projects.filter(p => p.project.fundingStatus === "funded");
  const completed = funded.filter(p => p.project.status === "complete");

  return {
    rate: funded.length > 0 ? (completed.length / funded.length) * 100 : 50,
    total: funded.length,
    completed: completed.length,
  };
}

/**
 * Calculate on-time delivery rate for milestones
 */
async function calculateOnTimeDelivery(personId: string): Promise<{ rate: number; total: number; onTime: number }> {
  const projectIds = await prisma.projectPerson.findMany({
    where: { personId },
    select: { projectId: true },
  });

  const milestones = await prisma.milestone.findMany({
    where: {
      projectId: { in: projectIds.map(p => p.projectId) },
      status: "complete",
      dueDate: { not: null },
      poaApprovedAt: { not: null },
    },
    select: {
      dueDate: true,
      poaApprovedAt: true,
    },
  });

  const onTime = milestones.filter(m => 
    m.poaApprovedAt && m.dueDate && m.poaApprovedAt <= m.dueDate
  );

  return {
    rate: milestones.length > 0 ? (onTime.length / milestones.length) * 100 : 50,
    total: milestones.length,
    onTime: onTime.length,
  };
}

/**
 * Calculate milestone quality based on PoA acceptance
 */
async function calculateMilestoneQuality(personId: string): Promise<{ rate: number; total: number; firstPass: number }> {
  const projectIds = await prisma.projectPerson.findMany({
    where: { personId },
    select: { projectId: true },
  });

  const milestones = await prisma.milestone.findMany({
    where: {
      projectId: { in: projectIds.map(p => p.projectId) },
      status: "complete",
    },
    select: {
      poaStatus: true,
    },
  });

  // First pass = approved without revision
  const firstPass = milestones.filter(m => m.poaStatus === "approved");

  return {
    rate: milestones.length > 0 ? (firstPass.length / milestones.length) * 100 : 50,
    total: milestones.length,
    firstPass: firstPass.length,
  };
}

/**
 * Calculate communication score based on monthly report submissions
 */
async function calculateCommunication(personId: string): Promise<{ rate: number; total: number; submitted: number }> {
  const projectIds = await prisma.projectPerson.findMany({
    where: { personId },
    select: { projectId: true },
  });

  const reports = await prisma.monthlyReport.findMany({
    where: {
      projectId: { in: projectIds.map(p => p.projectId) },
    },
  });

  // Expected reports would be calculated based on project duration
  // For now, use a simple heuristic
  const expectedReports = projectIds.length * 6; // Assume ~6 months avg
  const submittedReports = reports.length;

  return {
    rate: expectedReports > 0 ? Math.min((submittedReports / expectedReports) * 100, 100) : 50,
    total: expectedReports,
    submitted: submittedReports,
  };
}

/**
 * Calculate community rating from reviews
 */
async function calculateCommunityRating(personId: string): Promise<{ rate: number; total: number; avgRating: number }> {
  const projectIds = await prisma.projectPerson.findMany({
    where: { personId },
    select: { projectId: true },
  });

  const reviews = await prisma.review.findMany({
    where: {
      projectId: { in: projectIds.map(p => p.projectId) },
    },
    select: {
      rating: true,
    },
  });

  if (reviews.length === 0) {
    return { rate: 50, total: 0, avgRating: 0 };
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  // Convert 1-5 rating to 0-100 score
  const rate = ((avgRating - 1) / 4) * 100;

  return {
    rate,
    total: reviews.length,
    avgRating,
  };
}

/**
 * Calculate response rate to flags and concerns
 */
async function calculateResponseRate(personId: string): Promise<{ rate: number; total: number; responded: number }> {
  const projectIds = await prisma.projectPerson.findMany({
    where: { personId },
    select: { projectId: true },
  });

  const concerns = await prisma.concern.findMany({
    where: {
      projectId: { in: projectIds.map(p => p.projectId) },
    },
    include: {
      responses: true,
    },
  });

  const withResponses = concerns.filter(c => c.responses.length > 0);

  return {
    rate: concerns.length > 0 ? (withResponses.length / concerns.length) * 100 : 100,
    total: concerns.length,
    responded: withResponses.length,
  };
}

/**
 * Calculate full accountability score for a person
 */
export async function calculatePersonScore(personId: string): Promise<AccountabilityResult> {
  const [
    completionRate,
    onTimeDelivery,
    milestoneQuality,
    communication,
    communityRating,
    responseRate,
    flagImpact,
  ] = await Promise.all([
    calculateCompletionRate(personId),
    calculateOnTimeDelivery(personId),
    calculateMilestoneQuality(personId),
    calculateCommunication(personId),
    calculateCommunityRating(personId),
    calculateResponseRate(personId),
    calculateFlagPenalty(personId),
  ]);

  const breakdown: ScoreBreakdown = {
    completionRate: {
      value: completionRate.rate,
      weight: WEIGHTS.completionRate,
      contribution: completionRate.rate * WEIGHTS.completionRate,
    },
    onTimeDelivery: {
      value: onTimeDelivery.rate,
      weight: WEIGHTS.onTimeDelivery,
      contribution: onTimeDelivery.rate * WEIGHTS.onTimeDelivery,
    },
    milestoneQuality: {
      value: milestoneQuality.rate,
      weight: WEIGHTS.milestoneQuality,
      contribution: milestoneQuality.rate * WEIGHTS.milestoneQuality,
    },
    communication: {
      value: communication.rate,
      weight: WEIGHTS.communication,
      contribution: communication.rate * WEIGHTS.communication,
    },
    communityRating: {
      value: communityRating.rate,
      weight: WEIGHTS.communityRating,
      contribution: communityRating.rate * WEIGHTS.communityRating,
    },
    responseRate: {
      value: responseRate.rate,
      weight: WEIGHTS.responseRate,
      contribution: responseRate.rate * WEIGHTS.responseRate,
    },
  };

  const baseScore = Math.round(
    breakdown.completionRate.contribution +
    breakdown.onTimeDelivery.contribution +
    breakdown.milestoneQuality.contribution +
    breakdown.communication.contribution +
    breakdown.communityRating.contribution +
    breakdown.responseRate.contribution
  );

  // Apply flag penalty (deduct from base score)
  const score = Math.max(0, Math.min(100, baseScore - flagImpact.totalPenalty));

  const dataPoints =
    completionRate.total +
    onTimeDelivery.total +
    milestoneQuality.total +
    communityRating.total +
    responseRate.total;

  return {
    personId,
    score,
    badge: getBadge(score),
    breakdown,
    confidence: getConfidence(dataPoints),
    dataPoints,
    flagImpact,
    calculatedAt: new Date(),
  };
}

/**
 * Store accountability score in database
 */
export async function storePersonScore(result: AccountabilityResult): Promise<void> {
  const previewUntil = new Date(result.calculatedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
  await prisma.accountabilityScore.upsert({
    where: { personId: result.personId },
    update: {
      overallScore: result.score,
      completionScore: Math.round(result.breakdown.completionRate.value),
      deliveryScore: Math.round(result.breakdown.onTimeDelivery.value),
      communityScore: Math.round(result.breakdown.communityRating.value),
      efficiencyScore: Math.round(result.breakdown.milestoneQuality.value),
      communicationScore: Math.round(result.breakdown.communication.value),
      flagPenalty: result.flagImpact.totalPenalty,
      confirmedFlags: result.flagImpact.confirmedFlags,
      badge: result.badge,
      confidence: result.confidence,
      dataPoints: result.dataPoints,
      status: "preview",
      previewUntil,
      calculatedAt: result.calculatedAt,
    },
    create: {
      personId: result.personId,
      overallScore: result.score,
      completionScore: Math.round(result.breakdown.completionRate.value),
      deliveryScore: Math.round(result.breakdown.onTimeDelivery.value),
      communityScore: Math.round(result.breakdown.communityRating.value),
      efficiencyScore: Math.round(result.breakdown.milestoneQuality.value),
      communicationScore: Math.round(result.breakdown.communication.value),
      flagPenalty: result.flagImpact.totalPenalty,
      confirmedFlags: result.flagImpact.confirmedFlags,
      badge: result.badge,
      confidence: result.confidence,
      dataPoints: result.dataPoints,
      status: "preview",
      previewUntil,
      calculatedAt: result.calculatedAt,
    },
  });

  await prisma.accountabilityNotification.create({
    data: {
      personId: result.personId,
      type: "score_preview",
      payload: { previewUntil },
    },
  });

  await prisma.accountabilityScoreAudit.create({
    data: {
      score: { connect: { personId: result.personId } },
      action: "score_calculated",
      payload: { score: result.score, badge: result.badge },
    },
  });
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export async function calculateOrganizationScore(
  organizationId: string
): Promise<OrganizationAccountabilityResult> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      members: { select: { personId: true } },
      fundedProposalsCount: true,
      completedProposalsCount: true,
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  const memberIds = organization.members.map((member) => member.personId);
  const projectLinks = await prisma.projectOrganization.findMany({
    where: { organizationId: organization.id },
    select: { projectId: true },
  });
  const projectIds = projectLinks.map((link) => link.projectId);
  const projectPeople = projectIds.length
    ? await prisma.projectPerson.findMany({
        where: { projectId: { in: projectIds } },
        select: { projectId: true, personId: true, isPrimary: true },
      })
    : [];
  const memberScores = memberIds.length
    ? await prisma.accountabilityScore.findMany({
        where: { personId: { in: memberIds } },
        select: { overallScore: true, badge: true, personId: true },
      })
    : [];

  const baseScore = memberScores.length
    ? memberScores.reduce((sum, score) => sum + score.overallScore, 0) / memberScores.length
    : 50;

  let modifier = 0;
  if (organization.completedProposalsCount > 3) {
    modifier += 10;
  }

  if (projectIds.length <= 1) {
    modifier += 5;
  } else {
    const teamMap = new Map<string, Set<string>>();
    const primaryMap = new Map<string, Set<string>>();

    projectPeople.forEach((person) => {
      if (!teamMap.has(person.projectId)) {
        teamMap.set(person.projectId, new Set());
        primaryMap.set(person.projectId, new Set());
      }
      teamMap.get(person.projectId)?.add(person.personId);
      if (person.isPrimary) {
        primaryMap.get(person.projectId)?.add(person.personId);
      }
    });

    const teams = Array.from(teamMap.values());
    const primaryTeams = Array.from(primaryMap.values()).filter((team) => team.size > 0);

    const computeOverlap = (groups: Array<Set<string>>) => {
      let overlapTotal = 0;
      let comparisons = 0;
      for (let i = 0; i < groups.length; i += 1) {
        for (let j = i + 1; j < groups.length; j += 1) {
          const groupA = groups[i];
          const groupB = groups[j];
          const intersection = new Set([...groupA].filter((member) => groupB.has(member)));
          const union = new Set([...groupA, ...groupB]);
          overlapTotal += union.size > 0 ? intersection.size / union.size : 0;
          comparisons += 1;
        }
      }
      return comparisons > 0 ? overlapTotal / comparisons : 1;
    };

    const averageOverlap = computeOverlap(teams);
    if (averageOverlap >= 0.5) {
      modifier += 5;
    }

    const primaryOverlap = computeOverlap(primaryTeams);
    if (primaryOverlap < 0.3) {
      modifier -= 10;
    }
  }

  const hasConcerningMember = memberScores.some((score) => score.badge === "CONCERNING");
  if (hasConcerningMember) {
    modifier -= 15;
  }

  const score = clampScore(Math.round(baseScore + modifier));

  return {
    organizationId: organization.id,
    score,
    badge: getBadge(score),
    calculatedAt: new Date(),
  };
}

export async function storeOrganizationScore(
  result: OrganizationAccountabilityResult
): Promise<void> {
  await prisma.organizationAccountabilityScore.upsert({
    where: { organizationId: result.organizationId },
    update: {
      overallScore: result.score,
      badge: result.badge,
      calculatedAt: result.calculatedAt,
    },
    create: {
      organizationId: result.organizationId,
      overallScore: result.score,
      badge: result.badge,
      calculatedAt: result.calculatedAt,
    },
  });
}

/**
 * Calculate and store scores for all people
 */
export async function recalculateAllScores(): Promise<{ processed: number; errors: number }> {
  const [people, organizations] = await Promise.all([
    prisma.person.findMany({ select: { id: true } }),
    prisma.organization.findMany({ select: { id: true } }),
  ]);

  let processed = 0;
  let errors = 0;

  for (const person of people) {
    try {
      const result = await calculatePersonScore(person.id);
      await storePersonScore(result);
      processed++;
    } catch (error) {
      console.error(`Error calculating score for person ${person.id}:`, error);
      errors++;
    }
  }

  for (const organization of organizations) {
    try {
      const result = await calculateOrganizationScore(organization.id);
      await storeOrganizationScore(result);
      processed++;
    } catch (error) {
      console.error(`Error calculating score for organization ${organization.id}:`, error);
      errors++;
    }
  }

  return { processed, errors };
}
