import Link from "next/link";

import prisma from "../../lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = {
  fund?: string;
  sort?: string;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const RankBadge = ({ rank }: { rank: number }) => {
  const colors: Record<number, string> = {
    1: "bg-amber-400 text-amber-900 dark:bg-amber-500 dark:text-amber-950",
    2: "bg-slate-300 text-slate-700 dark:bg-slate-400 dark:text-slate-900",
    3: "bg-orange-300 text-orange-800 dark:bg-orange-400 dark:text-orange-950",
  };

  const colorClass = colors[rank] ?? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}
    >
      {rank}
    </span>
  );
};

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const fundFilter = params.fund ?? "";
  const sortBy = params.sort ?? "funding";

  const fundWhereClause = fundFilter ? { fundId: fundFilter } : {};

  const projectsRaw = await prisma.project.findMany({
    where: fundWhereClause,
    include: {
      fund: true,
      milestones: {
        select: { status: true },
      },
      _count: {
        select: { projectPeople: true },
      },
    },
  });

  const projectsWithCompletion = projectsRaw.map((p) => {
    const totalMilestones = p.milestones.length;
    const completedMilestones = p.milestones.filter(
      (m) => m.status === "completed"
    ).length;
    const completionRate =
      totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

    return {
      ...p,
      completionRate,
      totalMilestones,
      completedMilestones,
    };
  });

  const sortedProjects =
    sortBy === "completion"
      ? projectsWithCompletion.sort((a, b) => b.completionRate - a.completionRate)
      : projectsWithCompletion.sort(
          (a, b) => Number(b.fundingAmount) - Number(a.fundingAmount)
        );

  const topProjects = sortedProjects.slice(0, 25);

  const topContributors = await prisma.person.findMany({
    include: {
      projectPeople: {
        include: {
          project: {
            select: { fundingAmount: true },
          },
        },
      },
    },
    take: 100,
  });

  const contributorsWithStats = topContributors
    .map((person) => {
      const projectCount = person.projectPeople.length;
      const totalFunding = person.projectPeople.reduce(
        (sum, pp) => sum + Number(pp.project.fundingAmount),
        0
      );
      return {
        id: person.id,
        name: person.name,
        projectCount,
        totalFunding,
      };
    })
    .filter((c) => c.projectCount > 0)
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, 10);

  const funds = await prisma.fund.findMany({
    select: { id: true, name: true },
    orderBy: { number: "desc" },
  });

  const buildUrl = (overrides: Record<string, string>) => {
    const merged = { fund: fundFilter, sort: sortBy, ...overrides };
    const filtered = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v && v !== "funding")
    );
    const qs = new URLSearchParams(filtered).toString();
    return qs ? `/rankings?${qs}` : "/rankings";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Rankings</h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
            Top projects and contributors by funding and milestone completion.
          </p>
        </header>

        <section className="mb-8 flex flex-wrap items-center gap-3">
          <form method="GET" action="/rankings" className="flex items-center gap-2">
            <input type="hidden" name="sort" value={sortBy} />
            <select
              name="fund"
              defaultValue={fundFilter}
              className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Funds</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 rounded-lg bg-slate-700 dark:bg-slate-600 px-4 text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-slate-500"
            >
              Apply
            </button>
            {fundFilter && (
              <Link
                href={buildUrl({ fund: "" })}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear
              </Link>
            )}
          </form>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Sort by:</span>
            <Link
              href={buildUrl({ sort: "funding" })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                sortBy === "funding"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              Funding
            </Link>
            <Link
              href={buildUrl({ sort: "completion" })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                sortBy === "completion"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              Completion
            </Link>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Top Projects{" "}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                by {sortBy === "completion" ? "milestone completion" : "funding"}
              </span>
            </h2>

            {topProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-12 text-center">
                <p className="text-slate-600 dark:text-slate-400">No projects found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProjects.map((project, idx) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 transition-colors hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <RankBadge rank={idx + 1} />
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {project.fund.name} · {project.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(Number(project.fundingAmount))}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {project.completedMilestones}/{project.totalMilestones}{" "}
                        milestones ({Math.round(project.completionRate * 100)}%)
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Top Contributors
            </h2>

            {contributorsWithStats.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-12 text-center">
                <p className="text-slate-600 dark:text-slate-400">No contributors found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contributorsWithStats.map((person, idx) => (
                  <Link
                    key={person.id}
                    href={`/people/${person.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 transition-colors hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {person.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {person.projectCount} project
                        {person.projectCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(person.totalFunding)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
