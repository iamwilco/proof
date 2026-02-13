import prisma from "./prisma";
import { generateEmbedding, searchSimilar } from "./ai";

export interface UserPreferences {
  userId: string;
  viewedProjects: string[];
  bookmarkedProjects: string[];
  votedProjects: Array<{ projectId: string; vote: "yes" | "no" }>;
  preferredCategories: string[];
  preferredFunds: string[];
}

export interface Recommendation {
  projectId: string;
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    fundingAmount: unknown;
    status: string;
    fund: { name: string };
  };
  score: number;
  reasons: string[];
}

// In-memory user interaction tracking (would be database in production)
const userInteractions: Map<string, UserPreferences> = new Map();

export function trackInteraction(
  userId: string,
  type: "view" | "bookmark" | "vote",
  projectId: string,
  vote?: "yes" | "no"
): void {
  let prefs = userInteractions.get(userId);
  
  if (!prefs) {
    prefs = {
      userId,
      viewedProjects: [],
      bookmarkedProjects: [],
      votedProjects: [],
      preferredCategories: [],
      preferredFunds: [],
    };
    userInteractions.set(userId, prefs);
  }

  switch (type) {
    case "view":
      if (!prefs.viewedProjects.includes(projectId)) {
        prefs.viewedProjects.push(projectId);
      }
      break;
    case "bookmark":
      if (!prefs.bookmarkedProjects.includes(projectId)) {
        prefs.bookmarkedProjects.push(projectId);
      }
      break;
    case "vote":
      const existingVote = prefs.votedProjects.find((v) => v.projectId === projectId);
      if (!existingVote && vote) {
        prefs.votedProjects.push({ projectId, vote });
      }
      break;
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const prefs = userInteractions.get(userId);
  
  if (prefs) {
    // Enrich with category/fund preferences from interactions
    const interactedProjectIds = [
      ...prefs.viewedProjects.slice(-20),
      ...prefs.bookmarkedProjects,
      ...prefs.votedProjects.filter((v) => v.vote === "yes").map((v) => v.projectId),
    ];

    if (interactedProjectIds.length > 0) {
      const projects = await prisma.project.findMany({
        where: { id: { in: interactedProjectIds } },
        select: { category: true, fundId: true },
      });

      const categoryCounts: Record<string, number> = {};
      const fundCounts: Record<string, number> = {};

      for (const p of projects) {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        fundCounts[p.fundId] = (fundCounts[p.fundId] || 0) + 1;
      }

      prefs.preferredCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat]) => cat);

      prefs.preferredFunds = Object.entries(fundCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([fund]) => fund);
    }

    return prefs;
  }

  return {
    userId,
    viewedProjects: [],
    bookmarkedProjects: [],
    votedProjects: [],
    preferredCategories: [],
    preferredFunds: [],
  };
}

export async function getRecommendations(
  userId: string,
  limit: number = 10
): Promise<Recommendation[]> {
  const prefs = await getUserPreferences(userId);
  const recommendations: Recommendation[] = [];
  const seenIds = new Set([
    ...prefs.viewedProjects,
    ...prefs.bookmarkedProjects,
    ...prefs.votedProjects.map((v) => v.projectId),
  ]);

  // Strategy 1: Content-based filtering using embeddings
  if (prefs.bookmarkedProjects.length > 0 || prefs.votedProjects.some((v) => v.vote === "yes")) {
    const likedProjects = [
      ...prefs.bookmarkedProjects,
      ...prefs.votedProjects.filter((v) => v.vote === "yes").map((v) => v.projectId),
    ].slice(-5);

    for (const projectId of likedProjects) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true, description: true },
      });

      if (project) {
        const text = `${project.title}\n${project.description}`;
        const { embedding } = await generateEmbedding(text);
        const similar = await searchSimilar(embedding, 5, { type: "project" });

        for (const result of similar) {
          if (!seenIds.has(result.id) && result.score > 0.6) {
            seenIds.add(result.id);
            const proj = await prisma.project.findUnique({
              where: { id: result.id },
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                fundingAmount: true,
                status: true,
                fund: { select: { name: true } },
              },
            });

            if (proj) {
              recommendations.push({
                projectId: result.id,
                project: proj,
                score: result.score,
                reasons: [`Similar to "${project.title.slice(0, 30)}..."`],
              });
            }
          }
        }
      }
    }
  }

  // Strategy 2: Category-based recommendations
  if (prefs.preferredCategories.length > 0) {
    const categoryProjects = await prisma.project.findMany({
      where: {
        category: { in: prefs.preferredCategories },
        id: { notIn: Array.from(seenIds) },
        fundingStatus: "funded",
      },
      orderBy: { yesVotes: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fundingAmount: true,
        status: true,
        fund: { select: { name: true } },
      },
    });

    for (const project of categoryProjects) {
      if (!seenIds.has(project.id)) {
        seenIds.add(project.id);
        recommendations.push({
          projectId: project.id,
          project,
          score: 0.7,
          reasons: [`In your preferred category: ${project.category}`],
        });
      }
    }
  }

  // Strategy 3: Collaborative filtering (simplified)
  // Find users with similar interactions and recommend their liked projects
  const similarUserProjects = await findCollaborativeRecommendations(userId, seenIds);
  for (const rec of similarUserProjects) {
    if (!seenIds.has(rec.projectId)) {
      seenIds.add(rec.projectId);
      recommendations.push(rec);
    }
  }

  // Strategy 4: Popular projects as fallback
  if (recommendations.length < limit) {
    const popularProjects = await prisma.project.findMany({
      where: {
        id: { notIn: Array.from(seenIds) },
        fundingStatus: "funded",
      },
      orderBy: { yesVotes: "desc" },
      take: limit - recommendations.length,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fundingAmount: true,
        status: true,
        fund: { select: { name: true } },
      },
    });

    for (const project of popularProjects) {
      recommendations.push({
        projectId: project.id,
        project,
        score: 0.5,
        reasons: ["Popular in the community"],
      });
    }
  }

  // Sort by score and limit
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function findCollaborativeRecommendations(
  userId: string,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const userPrefs = userInteractions.get(userId);
  if (!userPrefs) return [];

  const userLikedSet = new Set([
    ...userPrefs.bookmarkedProjects,
    ...userPrefs.votedProjects.filter((v) => v.vote === "yes").map((v) => v.projectId),
  ]);

  if (userLikedSet.size === 0) return [];

  const recommendations: Recommendation[] = [];
  const candidateProjects: Map<string, number> = new Map();

  // Find similar users based on overlap
  for (const [otherId, otherPrefs] of userInteractions) {
    if (otherId === userId) continue;

    const otherLikedSet = new Set([
      ...otherPrefs.bookmarkedProjects,
      ...otherPrefs.votedProjects.filter((v) => v.vote === "yes").map((v) => v.projectId),
    ]);

    // Calculate overlap
    let overlap = 0;
    for (const id of userLikedSet) {
      if (otherLikedSet.has(id)) overlap++;
    }

    if (overlap >= 2) {
      // This user is similar, get their unique likes
      for (const id of otherLikedSet) {
        if (!userLikedSet.has(id) && !excludeIds.has(id)) {
          candidateProjects.set(id, (candidateProjects.get(id) || 0) + overlap);
        }
      }
    }
  }

  // Get top candidates
  const topCandidates = Array.from(candidateProjects.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [projectId, overlapScore] of topCandidates) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fundingAmount: true,
        status: true,
        fund: { select: { name: true } },
      },
    });

    if (project) {
      recommendations.push({
        projectId,
        project,
        score: 0.6 + overlapScore * 0.05,
        reasons: ["Liked by users with similar interests"],
      });
    }
  }

  return recommendations;
}

export function getInteractionStats(userId: string): {
  views: number;
  bookmarks: number;
  votes: number;
  preferredCategories: string[];
} {
  const prefs = userInteractions.get(userId);
  
  if (!prefs) {
    return {
      views: 0,
      bookmarks: 0,
      votes: 0,
      preferredCategories: [],
    };
  }

  return {
    views: prefs.viewedProjects.length,
    bookmarks: prefs.bookmarkedProjects.length,
    votes: prefs.votedProjects.length,
    preferredCategories: prefs.preferredCategories,
  };
}
