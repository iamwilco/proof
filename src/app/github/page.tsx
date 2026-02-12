import Link from "next/link";
import prisma from "../../lib/prisma";

export const revalidate = 300;

const formatDate = (date: Date | null) => {
  if (!date) return "Never";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

const getActivityColor = (score: number | null) => {
  if (!score) return "bg-slate-100 text-slate-500";
  if (score >= 70) return "bg-emerald-100 text-emerald-700";
  if (score >= 40) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

const getActivityLabel = (score: number | null) => {
  if (!score) return "No Data";
  if (score >= 70) return "Very Active";
  if (score >= 40) return "Moderately Active";
  if (score >= 20) return "Low Activity";
  return "Inactive";
};

export default async function GitHubDashboardPage() {
  const projectsWithGitHub = await prisma.project.findMany({
    where: {
      githubUrl: { not: null },
    },
    orderBy: [
      { githubActivityScore: "desc" },
      { githubLastSync: "desc" },
    ],
    select: {
      id: true,
      title: true,
      status: true,
      githubUrl: true,
      githubOwner: true,
      githubRepo: true,
      githubActivityScore: true,
      githubLastSync: true,
      fund: { select: { name: true } },
    },
    take: 100,
  });

  const totalWithGitHub = projectsWithGitHub.length;
  const activeProjects = projectsWithGitHub.filter(
    (p) => p.githubActivityScore && p.githubActivityScore >= 40
  ).length;
  const now = new Date();
  const recentlyUpdated = projectsWithGitHub.filter((p) => {
    if (!p.githubLastSync) return false;
    const days = (now.getTime() - p.githubLastSync.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }).length;

  const avgScore =
    projectsWithGitHub.length > 0
      ? projectsWithGitHub.reduce((sum, p) => sum + (p.githubActivityScore || 0), 0) /
        projectsWithGitHub.length
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">GitHub Activity</h1>
          <p className="mt-2 text-sm text-slate-600">
            Track development activity for open source projects.
          </p>
        </header>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Projects with GitHub
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{totalWithGitHub}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Active Projects
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{activeProjects}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Recently Synced
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{recentlyUpdated}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Avg Activity Score
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{avgScore.toFixed(1)}</p>
          </div>
        </div>

        {/* Activity Chart (simplified bar representation) */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Activity Distribution
          </h2>
          <div className="flex items-end gap-1 h-32">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((threshold) => {
              const count = projectsWithGitHub.filter((p) => {
                const score = p.githubActivityScore || 0;
                return score >= threshold && score < threshold + 10;
              }).length;
              const height = totalWithGitHub > 0 ? (count / totalWithGitHub) * 100 : 0;
              return (
                <div key={threshold} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t ${
                      threshold >= 70
                        ? "bg-emerald-500"
                        : threshold >= 40
                        ? "bg-amber-500"
                        : "bg-red-400"
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-xs text-slate-400">{threshold}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">Activity Score Range</p>
        </div>

        {/* Projects Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
            <h2 className="font-semibold text-slate-900">Projects</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {projectsWithGitHub.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                No projects with GitHub links found.
              </div>
            ) : (
              projectsWithGitHub.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600 truncate block"
                    >
                      {project.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span>{project.fund.name}</span>
                      <span>•</span>
                      <span>{project.status}</span>
                      {project.githubOwner && project.githubRepo && (
                        <>
                          <span>•</span>
                          <a
                            href={project.githubUrl || `https://github.com/${project.githubOwner}/${project.githubRepo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {project.githubOwner}/{project.githubRepo}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getActivityColor(
                          project.githubActivityScore
                        )}`}
                      >
                        {getActivityLabel(project.githubActivityScore)}
                      </span>
                      {project.githubActivityScore !== null && (
                        <p className="mt-1 text-xs text-slate-500">
                          Score: {project.githubActivityScore}/100
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-slate-400 w-24">
                      <p>Last synced</p>
                      <p className="text-slate-600">{formatDate(project.githubLastSync)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
