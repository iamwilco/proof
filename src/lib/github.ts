import prisma from "./prisma";

interface GitHubRepoStats {
  owner: string;
  repo: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  lastPush: Date | null;
  defaultBranch: string;
}

async function fetchSearchCount(
  query: string,
  token?: string
): Promise<number> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "PROOF-Catalyst-Transparency",
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/search/issues?q=${encodeURIComponent(query)}`,
    { headers, next: { revalidate: 3600 } }
  );

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return typeof data.total_count === "number" ? data.total_count : 0;
}

export async function fetchIssueStats(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubIssueStats | null> {
  try {
    const [openIssues, closedIssues] = await Promise.all([
      fetchSearchCount(`repo:${owner}/${repo} type:issue state:open`, token),
      fetchSearchCount(`repo:${owner}/${repo} type:issue state:closed`, token),
    ]);

    const total = openIssues + closedIssues;
    return {
      openIssues,
      closedIssues,
      closeRate: total > 0 ? closedIssues / total : null,
    };
  } catch (error) {
    console.error("Failed to fetch issue stats:", error);
    return null;
  }
}

export async function fetchPullRequestStats(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubPullRequestStats | null> {
  try {
    const [totalPRs, mergedPRs] = await Promise.all([
      fetchSearchCount(`repo:${owner}/${repo} type:pr`, token),
      fetchSearchCount(`repo:${owner}/${repo} type:pr is:merged`, token),
    ]);

    return {
      totalPRs,
      mergedPRs,
      mergeRate: totalPRs > 0 ? mergedPRs / totalPRs : null,
    };
  } catch (error) {
    console.error("Failed to fetch PR stats:", error);
    return null;
  }
}

interface GitHubCommitActivity {
  totalCommits: number;
  lastCommitDate: Date | null;
  commitsByWeek: number[];
  contributors: number;
}

interface GitHubIssueStats {
  openIssues: number;
  closedIssues: number;
  closeRate: number | null;
}

interface GitHubPullRequestStats {
  totalPRs: number;
  mergedPRs: number;
  mergeRate: number | null;
}

interface GitHubActivityResult {
  projectId: string;
  repoStats: GitHubRepoStats | null;
  commitActivity: GitHubCommitActivity | null;
  activityScore: number;
  error?: string;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null;

  const patterns = [
    /github\.com\/([^\/]+)\/([^\/\?#]+)/,
    /github\.com:([^\/]+)\/([^\/\?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ""),
      };
    }
  }

  return null;
}

export async function fetchGitHubRepoStats(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubRepoStats | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "PROOF-Catalyst-Transparency",
    };

    if (token) {
      headers.Authorization = `token ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers, next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    return {
      owner,
      repo,
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      openIssues: data.open_issues_count || 0,
      watchers: data.watchers_count || 0,
      lastPush: data.pushed_at ? new Date(data.pushed_at) : null,
      defaultBranch: data.default_branch || "main",
    };
  } catch (error) {
    console.error("Failed to fetch GitHub repo stats:", error);
    return null;
  }
}

export async function fetchCommitActivity(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubCommitActivity | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "PROOF-Catalyst-Transparency",
    };

    if (token) {
      headers.Authorization = `token ${token}`;
    }

    // Fetch commit activity (last year, by week)
    const activityResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`,
      { headers, next: { revalidate: 3600 } }
    );

    let commitsByWeek: number[] = [];
    let totalCommits = 0;

    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      if (Array.isArray(activityData)) {
        commitsByWeek = activityData.map((week: { total: number }) => week.total);
        totalCommits = commitsByWeek.reduce((a, b) => a + b, 0);
      }
    }

    // Fetch contributors
    const contributorsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1`,
      { headers, next: { revalidate: 3600 } }
    );

    let contributors = 0;
    if (contributorsResponse.ok) {
      const linkHeader = contributorsResponse.headers.get("Link");
      if (linkHeader) {
        const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
        contributors = lastPageMatch ? parseInt(lastPageMatch[1], 10) : 1;
      } else {
        const contribData = await contributorsResponse.json();
        contributors = Array.isArray(contribData) ? contribData.length : 0;
      }
    }

    // Fetch last commit
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
      { headers, next: { revalidate: 3600 } }
    );

    let lastCommitDate: Date | null = null;
    if (commitsResponse.ok) {
      const commitsData = await commitsResponse.json();
      if (Array.isArray(commitsData) && commitsData.length > 0) {
        lastCommitDate = new Date(commitsData[0].commit.committer.date);
      }
    }

    return {
      totalCommits,
      lastCommitDate,
      commitsByWeek,
      contributors,
    };
  } catch (error) {
    console.error("Failed to fetch commit activity:", error);
    return null;
  }
}

export function calculateActivityScore(
  repoStats: GitHubRepoStats | null,
  commitActivity: GitHubCommitActivity | null
): number {
  if (!repoStats && !commitActivity) return 0;

  let score = 0;

  if (repoStats) {
    // Stars contribute up to 20 points
    score += Math.min(20, Math.log10(repoStats.stars + 1) * 10);

    // Forks contribute up to 10 points
    score += Math.min(10, Math.log10(repoStats.forks + 1) * 5);

    // Recent push bonus (up to 20 points)
    if (repoStats.lastPush) {
      const daysSinceLastPush = Math.floor(
        (Date.now() - repoStats.lastPush.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastPush < 7) {
        score += 20;
      } else if (daysSinceLastPush < 30) {
        score += 15;
      } else if (daysSinceLastPush < 90) {
        score += 10;
      } else if (daysSinceLastPush < 180) {
        score += 5;
      }
    }
  }

  if (commitActivity) {
    // Recent commits (last 4 weeks) contribute up to 30 points
    const recentCommits = commitActivity.commitsByWeek.slice(-4).reduce((a, b) => a + b, 0);
    score += Math.min(30, recentCommits * 2);

    // Contributors contribute up to 20 points
    score += Math.min(20, commitActivity.contributors * 2);
  }

  return Math.min(100, Math.round(score));
}

export async function syncProjectGitHub(
  projectId: string,
  token?: string
): Promise<GitHubActivityResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, githubUrl: true, githubOwner: true, githubRepo: true },
  });

  if (!project) {
    return {
      projectId,
      repoStats: null,
      commitActivity: null,
      activityScore: 0,
      error: "Project not found",
    };
  }

  let owner = project.githubOwner;
  let repo = project.githubRepo;

  if (!owner || !repo) {
    if (project.githubUrl) {
      const parsed = parseGitHubUrl(project.githubUrl);
      if (parsed) {
        owner = parsed.owner;
        repo = parsed.repo;
      }
    }
  }

  if (!owner || !repo) {
    return {
      projectId,
      repoStats: null,
      commitActivity: null,
      activityScore: 0,
      error: "No GitHub URL configured",
    };
  }

  const repoStats = await fetchGitHubRepoStats(owner, repo, token);
  const commitActivity = await fetchCommitActivity(owner, repo, token);
  const issueStats = await fetchIssueStats(owner, repo, token);
  const pullRequestStats = await fetchPullRequestStats(owner, repo, token);
  const activityScore = calculateActivityScore(repoStats, commitActivity);

  // Update project with GitHub data
  await prisma.project.update({
    where: { id: projectId },
    data: {
      githubOwner: owner,
      githubRepo: repo,
      githubStars: repoStats?.stars ?? null,
      githubForks: repoStats?.forks ?? null,
      githubWatchers: repoStats?.watchers ?? null,
      githubOpenIssues: repoStats?.openIssues ?? null,
      githubLastPush: repoStats?.lastPush ?? null,
      githubLastCommit: commitActivity?.lastCommitDate ?? null,
      githubContributors: commitActivity?.contributors ?? null,
      githubCommitCount: commitActivity?.totalCommits ?? null,
      githubIssueCloseRate: issueStats?.closeRate ?? null,
      githubPrMergeRate: pullRequestStats?.mergeRate ?? null,
      githubActivityScore: activityScore,
      githubLastSync: new Date(),
    },
  });

  return {
    projectId,
    repoStats,
    commitActivity,
    activityScore,
  };
}

export async function syncAllProjectsGitHub(
  limit: number = 50,
  token?: string
): Promise<{ synced: number; failed: number }> {
  const projects = await prisma.project.findMany({
    where: {
      githubUrl: { not: null },
      OR: [
        { githubLastSync: null },
        { githubLastSync: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
    select: { id: true },
    take: limit,
  });

  let synced = 0;
  let failed = 0;

  for (const project of projects) {
    const result = await syncProjectGitHub(project.id, token);
    if (result.error) {
      failed++;
    } else {
      synced++;
    }

    // Rate limiting: wait 1 second between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { synced, failed };
}
