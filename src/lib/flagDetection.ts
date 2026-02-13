import prisma from "./prisma";
import type { Prisma } from "../generated/prisma";

interface DetectionResult {
  projectId: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  metadata: Prisma.InputJsonValue;
}

const SIMILARITY_THRESHOLD = 0.76;

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (text: string) =>
  new Set(
    normalizeText(text)
      .split(" ")
      .filter((token) => token.length > 2)
  );

const jaccardSimilarity = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return intersection / (a.size + b.size - intersection);
};

/**
 * Detect repeat delays: People with >2 incomplete/delayed projects
 */
async function detectRepeatDelays(): Promise<DetectionResult[]> {
  const results: DetectionResult[] = [];

  // Find people with multiple incomplete projects
  const peopleWithProjects = await prisma.projectPerson.groupBy({
    by: ["personId"],
    _count: { projectId: true },
    having: {
      projectId: { _count: { gte: 2 } },
    },
  });

  for (const person of peopleWithProjects) {
    const incompleteProjects = await prisma.project.findMany({
      where: {
        projectPeople: { some: { personId: person.personId } },
        status: { in: ["in_progress", "delayed", "at_risk"] },
        fundingStatus: "funded",
      },
      select: {
        id: true,
        title: true,
        status: true,
        fund: { select: { name: true } },
      },
    });

    if (incompleteProjects.length > 2) {
      const personData = await prisma.person.findUnique({
        where: { id: person.personId },
        select: { name: true },
      });

      // Flag each incomplete project
      for (const project of incompleteProjects) {
        results.push({
          projectId: project.id,
          category: "repeat_delays",
          severity: incompleteProjects.length > 4 ? "high" : "medium",
          title: `Proposer has ${incompleteProjects.length} incomplete projects`,
          description: `${personData?.name || "Unknown"} has ${incompleteProjects.length} funded projects that are incomplete or delayed. This may indicate capacity issues.`,
          metadata: {
            personId: person.personId,
            personName: personData?.name,
            incompleteCount: incompleteProjects.length,
            projectIds: incompleteProjects.map((p) => p.id),
            projectTitles: incompleteProjects.map((p) => p.title),
          },
        });
      }
    }
  }

  return results;
}

/**
 * Detect similar proposals based on lightweight text similarity.
 */
async function detectSimilarProposals(): Promise<DetectionResult[]> {
  const results: DetectionResult[] = [];
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      problem: true,
      solution: true,
      fundId: true,
      category: true,
    },
  });

  const grouped = new Map<string, typeof projects>();
  for (const project of projects) {
    const key = `${project.fundId}::${project.category}`;
    const list = grouped.get(key) ?? [];
    list.push(project);
    grouped.set(key, list);
  }

  for (const list of grouped.values()) {
    const candidates = list.slice(0, 50);
    for (let i = 0; i < candidates.length; i += 1) {
      const base = candidates[i];
      const baseText = [base.title, base.description, base.problem, base.solution]
        .filter(Boolean)
        .join(" ");
      const baseTokens = tokenize(baseText);

      for (let j = i + 1; j < candidates.length; j += 1) {
        const compare = candidates[j];
        const compareText = [compare.title, compare.description, compare.problem, compare.solution]
          .filter(Boolean)
          .join(" ");
        const compareTokens = tokenize(compareText);
        const similarityScore = jaccardSimilarity(baseTokens, compareTokens);

        if (similarityScore < SIMILARITY_THRESHOLD) continue;

        const severity = similarityScore > 0.86 ? "high" : "medium";
        const description = `Potentially similar proposals detected (${Math.round(
          similarityScore * 100
        )}% overlap). Review for duplicate scope or reuse.`;

        results.push({
          projectId: base.id,
          category: "similar_proposal",
          severity,
          title: `Similar proposal detected: ${compare.title}`,
          description,
          metadata: {
            similarProjectId: compare.id,
            similarProjectTitle: compare.title,
            similarityScore,
          },
        });

        results.push({
          projectId: compare.id,
          category: "similar_proposal",
          severity,
          title: `Similar proposal detected: ${base.title}`,
          description,
          metadata: {
            similarProjectId: base.id,
            similarProjectTitle: base.title,
            similarityScore,
          },
        });
      }
    }
  }

  return results;
}

/**
 * Detect ghost projects: No updates in 90+ days for funded, incomplete projects
 */
async function detectGhostProjects(): Promise<DetectionResult[]> {
  const results: DetectionResult[] = [];
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const ghostProjects = await prisma.project.findMany({
    where: {
      fundingStatus: "funded",
      status: { in: ["in_progress", "pending"] },
      updatedAt: { lt: ninetyDaysAgo },
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      fundingAmount: true,
      fund: { select: { name: true } },
    },
  });

  for (const project of ghostProjects) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - project.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    results.push({
      projectId: project.id,
      category: "ghost_project",
      severity: daysSinceUpdate > 180 ? "critical" : daysSinceUpdate > 120 ? "high" : "medium",
      title: `No updates for ${daysSinceUpdate} days`,
      description: `Project "${project.title}" has not been updated in ${daysSinceUpdate} days. Funded amount: $${project.fundingAmount}`,
      metadata: {
        daysSinceUpdate,
        lastUpdate: project.updatedAt.toISOString(),
        fundingAmount: project.fundingAmount.toString(),
        fundName: project.fund.name,
      },
    });
  }

  return results;
}

/**
 * Detect overdue milestones: >30 days past due date
 */
async function detectOverdueMilestones(): Promise<DetectionResult[]> {
  const results: DetectionResult[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const overdueMilestones = await prisma.milestone.findMany({
    where: {
      dueDate: { lt: thirtyDaysAgo },
      status: { in: ["pending", "in_progress"] },
      project: {
        fundingStatus: "funded",
        status: { notIn: ["completed", "cancelled"] },
      },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
      project: {
        select: {
          id: true,
          title: true,
          fund: { select: { name: true } },
        },
      },
    },
  });

  for (const milestone of overdueMilestones) {
    if (!milestone.dueDate) continue;

    const daysOverdue = Math.floor(
      (Date.now() - milestone.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    results.push({
      projectId: milestone.project.id,
      category: "overdue_milestone",
      severity: daysOverdue > 90 ? "high" : daysOverdue > 60 ? "medium" : "low",
      title: `Milestone "${milestone.title}" is ${daysOverdue} days overdue`,
      description: `Milestone was due on ${milestone.dueDate.toLocaleDateString()} but remains incomplete.`,
      metadata: {
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        dueDate: milestone.dueDate.toISOString(),
        daysOverdue,
        projectTitle: milestone.project.title,
        fundName: milestone.project.fund.name,
      },
    });
  }

  return results;
}

/**
 * Detect funding clusters: Same team funded across multiple funds
 */
async function detectFundingClusters(): Promise<DetectionResult[]> {
  const results: DetectionResult[] = [];

  // Find people with projects across multiple funds
  const crossFundPeople = await prisma.$queryRaw<
    Array<{ personId: string; fundCount: bigint; totalFunding: number }>
  >`
    SELECT pp."personId", COUNT(DISTINCT p."fundId") as "fundCount", 
           SUM(p."fundingAmount"::numeric) as "totalFunding"
    FROM "ProjectPerson" pp
    JOIN "Project" p ON pp."projectId" = p.id
    WHERE p."fundingStatus" = 'funded'
    GROUP BY pp."personId"
    HAVING COUNT(DISTINCT p."fundId") >= 3
    ORDER BY "totalFunding" DESC
  `;

  for (const row of crossFundPeople) {
    const person = await prisma.person.findUnique({
      where: { id: row.personId },
      select: { name: true },
    });

    const projects = await prisma.project.findMany({
      where: {
        projectPeople: { some: { personId: row.personId } },
        fundingStatus: "funded",
      },
      select: {
        id: true,
        title: true,
        fundingAmount: true,
        status: true,
        fund: { select: { name: true, number: true } },
      },
      orderBy: { fund: { number: "desc" } },
    });

    // Flag each project in the cluster
    for (const project of projects) {
      results.push({
        projectId: project.id,
        category: "funding_cluster",
        severity: Number(row.fundCount) > 5 ? "high" : "medium",
        title: `Part of ${row.fundCount}-fund cluster (${person?.name || "Unknown"})`,
        description: `This proposer has received funding in ${row.fundCount} different funds, totaling $${Math.round(row.totalFunding).toLocaleString()}. Review for capacity and delivery patterns.`,
        metadata: {
          personId: row.personId,
          personName: person?.name,
          fundCount: Number(row.fundCount),
          totalFunding: row.totalFunding,
          projectCount: projects.length,
          funds: [...new Set(projects.map((p) => p.fund.name))],
        },
      });
    }
  }

  return results;
}

/**
 * Notify admins about new automated flags
 */
async function notifyAdminsOfNewFlags(flagCount: number, categories: string[]): Promise<void> {
  if (flagCount === 0) return;

  // Get admin users
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });

  const categoryList = [...new Set(categories)].join(", ");
  
  // Create notifications for each admin
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "flag_alert",
        title: `${flagCount} new automated flag${flagCount > 1 ? "s" : ""} detected`,
        message: `Automated detection found ${flagCount} new flag${flagCount > 1 ? "s" : ""} requiring review. Categories: ${categoryList}`,
        read: false,
      },
    });
  }
}

/**
 * Run all detectors and create flags in database
 */
export async function runAllDetectors(): Promise<{
  created: number;
  skipped: number;
  errors: string[];
  byCategory: Record<string, number>;
}> {
  const stats = { created: 0, skipped: 0, errors: [] as string[], byCategory: {} as Record<string, number> };
  const createdCategories: string[] = [];

  const detectors = [
    { name: "repeat_delays", fn: detectRepeatDelays },
    { name: "ghost_project", fn: detectGhostProjects },
    { name: "overdue_milestone", fn: detectOverdueMilestones },
    { name: "funding_cluster", fn: detectFundingClusters },
    { name: "similar_proposal", fn: detectSimilarProposals },
  ];

  for (const detector of detectors) {
    try {
      const results = await detector.fn();
      stats.byCategory[detector.name] = 0;

      for (const result of results) {
        // Check if flag already exists (avoid duplicates)
        const existing = await prisma.flag.findFirst({
          where: {
            projectId: result.projectId,
            category: result.category,
            type: "automated",
            status: { in: ["pending", "confirmed"] },
          },
        });

        if (existing) {
          stats.skipped++;
          continue;
        }

        await prisma.flag.create({
          data: {
            projectId: result.projectId,
            type: "automated",
            category: result.category,
            severity: result.severity,
            status: "pending",
            title: result.title,
            description: result.description,
            metadata: result.metadata,
          },
        });
        stats.created++;
        stats.byCategory[detector.name]++;
        createdCategories.push(detector.name);
      }
    } catch (error) {
      stats.errors.push(`${detector.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Notify admins if new flags were created
  if (stats.created > 0) {
    await notifyAdminsOfNewFlags(stats.created, createdCategories);
  }

  return stats;
}

/**
 * Run a specific detector
 */
export async function runDetector(
  category:
    | "repeat_delays"
    | "ghost_project"
    | "overdue_milestone"
    | "funding_cluster"
    | "similar_proposal"
): Promise<DetectionResult[]> {
  switch (category) {
    case "repeat_delays":
      return detectRepeatDelays();
    case "ghost_project":
      return detectGhostProjects();
    case "overdue_milestone":
      return detectOverdueMilestones();
    case "funding_cluster":
      return detectFundingClusters();
    case "similar_proposal":
      return detectSimilarProposals();
    default:
      throw new Error(`Unknown detector: ${category}`);
  }
}

export {
  detectRepeatDelays,
  detectGhostProjects,
  detectOverdueMilestones,
  detectFundingClusters,
  detectSimilarProposals,
};
