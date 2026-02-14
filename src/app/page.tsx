import Link from "next/link";
import prisma from "../lib/prisma";

export const revalidate = 300;

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

const formatNumber = (num: number) => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

export default async function Home() {
  const [fundsData, projectsData, peopleData, orgsData, flagsData] = await Promise.all([
    prisma.fund.aggregate({
      _count: true,
      _sum: { totalAwarded: true, totalDistributed: true },
    }),
    prisma.project.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.person.aggregate({
      _count: true,
      _sum: { totalAmountAwarded: true },
    }),
    prisma.organization.aggregate({
      _count: true,
    }),
    prisma.flag.count({
      where: { status: { in: ["pending", "confirmed"] } },
    }),
  ]);

  const totalProjects = projectsData.reduce((sum, p) => sum + p._count, 0);
  const completedProjects = projectsData.find((p) => p.status === "completed")?._count || 0;
  const inProgressProjects = projectsData.find((p) => p.status === "in_progress")?._count || 0;
  const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

  const totalAwarded = Number(fundsData._sum.totalAwarded) || 0;
  const totalDistributed = Number(fundsData._sum.totalDistributed) || 0;
  const distributionRate = totalAwarded > 0 ? (totalDistributed / totalAwarded) * 100 : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Project Catalyst transparency and accountability metrics
        </p>
      </header>

      {/* Key Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Awarded</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalAwarded)}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">across {fundsData._count} funds</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Projects</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{formatNumber(totalProjects)}</p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{completedProjects} completed</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">People</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{formatNumber(peopleData._count)}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatNumber(orgsData._count)} organizations</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Open Flags</p>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{flagsData}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">pending review</p>
        </div>
      </section>

      {/* Progress Metrics */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Completion Rate</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Projects reaching completion status</p>
          <div className="mt-4 flex items-end gap-4">
            <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{completionRate.toFixed(1)}%</span>
            <span className="mb-1 text-sm text-slate-500 dark:text-slate-400">{completedProjects} / {totalProjects}</span>
          </div>
          <div className="mt-4 h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${completionRate}%` }} />
          </div>
          <div className="mt-4 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{inProgressProjects} in progress</span>
            <span>{totalProjects - completedProjects - inProgressProjects} other</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Fund Distribution</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Percentage of awarded funds distributed</p>
          <div className="mt-4 flex items-end gap-4">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{distributionRate.toFixed(1)}%</span>
            <span className="mb-1 text-sm text-slate-500 dark:text-slate-400">{formatCurrency(totalDistributed)} / {formatCurrency(totalAwarded)}</span>
          </div>
          <div className="mt-4 h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-3 rounded-full bg-blue-500" style={{ width: `${distributionRate}%` }} />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/projects"
          className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600"
        >
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">Browse Projects</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View all funded proposals</p>
        </Link>
        <Link
          href="/rankings"
          className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600"
        >
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">Rankings</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Top performers by metrics</p>
        </Link>
        <Link
          href="/flags"
          className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-red-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-red-600"
        >
          <h3 className="font-semibold text-slate-900 group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">Flags</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review accountability concerns</p>
        </Link>
        <Link
          href="/discover"
          className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600"
        >
          <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">Discover</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Explore new proposals</p>
        </Link>
      </section>
    </div>
  );
}
