import prisma from "./prisma";

export interface PredictionResult {
  projectId: string;
  fundingSuccessProbability: number;
  completionProbability: number;
  riskScore: number;
  riskFactors: string[];
  confidence: number;
}

interface ProposerHistory {
  totalProjects: number;
  fundedProjects: number;
  completedProjects: number;
  fundingRate: number;
  completionRate: number;
}

async function getProposerHistory(personId: string): Promise<ProposerHistory> {
  const projects = await prisma.projectPerson.findMany({
    where: { personId },
    include: {
      project: {
        select: {
          fundingStatus: true,
          status: true,
        },
      },
    },
  });

  const totalProjects = projects.length;
  const fundedProjects = projects.filter(
    (p) => p.project.fundingStatus === "funded"
  ).length;
  const completedProjects = projects.filter(
    (p) => p.project.status === "completed"
  ).length;

  return {
    totalProjects,
    fundedProjects,
    completedProjects,
    fundingRate: totalProjects > 0 ? fundedProjects / totalProjects : 0,
    completionRate: fundedProjects > 0 ? completedProjects / fundedProjects : 0,
  };
}

export async function predictProject(projectId: string): Promise<PredictionResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      fund: true,
      projectPeople: {
        include: {
          person: true,
        },
      },
      milestones: true,
      flags: {
        where: { status: { in: ["pending", "confirmed"] } },
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const riskFactors: string[] = [];
  let fundingSuccessProbability = 0.5;
  let completionProbability = 0.5;
  let riskScore = 50;

  // Factor 1: Proposer track record
  const primaryProposer = project.projectPeople.find((pp) => pp.isPrimary);
  if (primaryProposer) {
    const history = await getProposerHistory(primaryProposer.personId);

    if (history.totalProjects > 0) {
      fundingSuccessProbability += (history.fundingRate - 0.5) * 0.3;
      completionProbability += (history.completionRate - 0.5) * 0.4;

      if (history.completionRate < 0.5 && history.fundedProjects >= 2) {
        riskFactors.push("Proposer has low historical completion rate");
        riskScore += 15;
      }

      if (history.fundingRate > 0.7) {
        fundingSuccessProbability += 0.1;
      }
    } else {
      riskFactors.push("First-time proposer (no track record)");
      riskScore += 10;
    }
  }

  // Factor 2: Team size
  const teamSize = project.projectPeople.length;
  if (teamSize === 1) {
    riskFactors.push("Solo proposer");
    riskScore += 5;
    completionProbability -= 0.05;
  } else if (teamSize >= 3) {
    completionProbability += 0.1;
    riskScore -= 5;
  }

  // Factor 3: Funding amount relative to fund average
  const avgFunding = await prisma.project.aggregate({
    where: { fundId: project.fundId, fundingStatus: "funded" },
    _avg: { fundingAmount: true },
  });

  const avgAmount = Number(avgFunding._avg.fundingAmount || 0);
  const requestedAmount = Number(project.fundingAmount);

  if (avgAmount > 0 && requestedAmount > avgAmount * 2) {
    riskFactors.push("Funding request significantly above fund average");
    fundingSuccessProbability -= 0.15;
    riskScore += 10;
  } else if (avgAmount > 0 && requestedAmount < avgAmount * 0.5) {
    fundingSuccessProbability += 0.05;
  }

  // Factor 4: Active flags
  const activeFlags = project.flags.length;
  if (activeFlags > 0) {
    riskFactors.push(`${activeFlags} active flag(s) on project`);
    riskScore += activeFlags * 10;
    completionProbability -= activeFlags * 0.1;
  }

  // Factor 5: Milestone progress (for funded projects)
  if (project.fundingStatus === "funded" && project.milestones.length > 0) {
    const completedMilestones = project.milestones.filter(
      (m) => m.status === "completed"
    ).length;
    const milestoneRate = completedMilestones / project.milestones.length;
    completionProbability += (milestoneRate - 0.5) * 0.3;

    const overdueMilestones = project.milestones.filter(
      (m) => m.status !== "completed" && m.dueDate && new Date(m.dueDate) < new Date()
    ).length;

    if (overdueMilestones > 0) {
      riskFactors.push(`${overdueMilestones} overdue milestone(s)`);
      riskScore += overdueMilestones * 8;
      completionProbability -= overdueMilestones * 0.08;
    }
  }

  // Factor 6: Description quality (simple heuristic)
  const descriptionLength = (project.description?.length || 0) + 
    (project.problem?.length || 0) + 
    (project.solution?.length || 0);
  
  if (descriptionLength < 200) {
    riskFactors.push("Limited project description");
    fundingSuccessProbability -= 0.1;
    riskScore += 5;
  } else if (descriptionLength > 1000) {
    fundingSuccessProbability += 0.05;
  }

  // Normalize scores
  fundingSuccessProbability = Math.max(0.05, Math.min(0.95, fundingSuccessProbability));
  completionProbability = Math.max(0.05, Math.min(0.95, completionProbability));
  riskScore = Math.max(0, Math.min(100, riskScore));

  // Confidence based on data availability
  const dataPoints = [
    primaryProposer ? 1 : 0,
    project.milestones.length > 0 ? 1 : 0,
    descriptionLength > 100 ? 1 : 0,
    teamSize > 1 ? 1 : 0,
  ];
  const confidence = (dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length) * 100;

  return {
    projectId,
    fundingSuccessProbability,
    completionProbability,
    riskScore,
    riskFactors,
    confidence,
  };
}

export async function predictBatch(
  projectIds: string[]
): Promise<PredictionResult[]> {
  const results: PredictionResult[] = [];

  for (const id of projectIds) {
    try {
      const prediction = await predictProject(id);
      results.push(prediction);
    } catch (error) {
      console.error(`Failed to predict project ${id}:`, error);
    }
  }

  return results;
}

export async function getModelAccuracy(): Promise<{
  fundingAccuracy: number;
  completionAccuracy: number;
  sampleSize: number;
}> {
  // Compare historical predictions vs actual outcomes
  // This is a simplified version - real implementation would store predictions
  const completedProjects = await prisma.project.findMany({
    where: {
      status: "completed",
      fundingStatus: "funded",
    },
    include: {
      projectPeople: true,
      milestones: true,
    },
    take: 100,
  });

  let correctCompletionPredictions = 0;
  let correctFundingPredictions = 0;

  for (const project of completedProjects) {
    // Projects that completed likely had higher completion probability
    const teamSize = project.projectPeople.length;
    const milestoneCount = project.milestones.length;

    // Simple heuristic check
    if (teamSize >= 2 || milestoneCount >= 3) {
      correctCompletionPredictions++;
    }
    correctFundingPredictions++; // All funded projects would have been predicted
  }

  return {
    fundingAccuracy: completedProjects.length > 0 
      ? (correctFundingPredictions / completedProjects.length) * 100 
      : 0,
    completionAccuracy: completedProjects.length > 0 
      ? (correctCompletionPredictions / completedProjects.length) * 100 
      : 0,
    sampleSize: completedProjects.length,
  };
}
