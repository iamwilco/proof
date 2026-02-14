import Link from "next/link";
import prisma from "../../lib/prisma";

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function CommunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sortBy = params.sort ?? "projects";

  const communities = await prisma.community.findMany({
    include: {
      createdBy: {
        select: { id: true, displayName: true },
      },
      projects: {
        include: {
          project: {
            select: {
              id: true,
              status: true,
              fundingAmount: true,
            },
          },
        },
      },
    },
    orderBy:
      sortBy === "recent"
        ? { createdAt: "desc" }
        : sortBy === "name"
          ? { name: "asc" }
          : undefined,
  });

  const communitiesWithStats = communities
    .map((community) => {
      const projectCount = community.projects.length;
      const totalFunding = community.projects.reduce(
        (sum, cp) => sum + Number(cp.project.fundingAmount),
        0
      );
      const completedCount = community.projects.filter(
        (cp) => cp.project.status === "completed"
      ).length;

      return {
        ...community,
        projectCount,
        totalFunding,
        completedCount,
      };
    })
    .sort((a, b) => {
      if (sortBy === "projects") return b.projectCount - a.projectCount;
      if (sortBy === "funding") return b.totalFunding - a.totalFunding;
      return 0;
    });

  const totalCommunities = communities.length;
  const totalProjects = communities.reduce((sum, c) => sum + c.projects.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Communities</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Topic-based groupings of Catalyst proposals.
            </p>
          </div>
          <Link
            href="/communities/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Community
          </Link>
        </header>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Total Communities
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalCommunities}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Projects in Communities
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalProjects}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Avg Projects/Community
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {totalCommunities > 0 ? (totalProjects / totalCommunities).toFixed(1) : 0}
            </p>
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Sort by:</span>
          <div className="flex gap-2">
            {[
              { key: "projects", label: "Most Projects" },
              { key: "funding", label: "Total Funding" },
              { key: "recent", label: "Recent" },
              { key: "name", label: "Name" },
            ].map((option) => (
              <Link
                key={option.key}
                href={`/communities?sort=${option.key}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  sortBy === option.key
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Communities Grid */}
        {communitiesWithStats.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">No communities yet.</p>
            <Link
              href="/communities/new"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create the first community
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {communitiesWithStats.map((community) => (
              <Link
                key={community.id}
                href={`/communities/${community.slug}`}
                className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 transition hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {community.name}
                </h2>
                {community.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                    {community.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {community.projectCount} projects
                  </span>
                  <span>
                    ${(community.totalFunding / 1000).toFixed(0)}k funding
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>
                    Created by {community.createdBy.displayName || "Anonymous"}
                  </span>
                  <span>
                    {community.completedCount}/{community.projectCount} completed
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
