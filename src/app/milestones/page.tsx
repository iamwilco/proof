import Link from "next/link";

import prisma from "../../lib/prisma";

export const revalidate = 300;

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);

interface PageProps {
  searchParams: Promise<{ fund?: string; status?: string }>;
}

export default async function MilestoneDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const fundFilter = params.fund ?? "";
  const statusFilter = params.status ?? "";

  const where: Record<string, unknown> = {};
  if (statusFilter) {
    where.status = statusFilter;
  }
  if (fundFilter) {
    where.project = { fundId: fundFilter };
  }

  const [milestones, statusStats, funds] = await Promise.all([
    prisma.milestone.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            fund: { select: { id: true, name: true, number: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 200,
    }),
    prisma.milestone.groupBy({
      by: ["status"],
      _count: { _all: true },
      where,
    }),
    prisma.fund.findMany({
      where: { number: { gt: 0 } },
      select: { id: true, name: true, number: true },
      orderBy: { number: "desc" },
    }),
  ]);

  const statusCounts = statusStats.reduce(
    (acc, row) => ({ ...acc, [row.status]: row._count._all }),
    {} as Record<string, number>
  );

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const pendingMilestones = milestones.filter((m) => m.status === "pending").length;
  const inProgressMilestones = milestones.filter((m) => m.status === "in_progress").length;

  const exportUrl = `/api/export?type=milestones&format=csv${
    fundFilter ? `&fund=${fundFilter}` : ""
  }${statusFilter ? `&status=${statusFilter}` : ""}`;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Milestone Status Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Track milestone progress across funded projects.
          </p>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Milestones
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(totalMilestones)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Completed
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {formatNumber(completedMilestones)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              In Progress
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {formatNumber(inProgressMilestones)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Pending
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {formatNumber(pendingMilestones)}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <form method="GET" action="/milestones" className="flex flex-wrap items-center gap-3">
            <select
              name="fund"
              defaultValue={fundFilter}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Funds</option>
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {Object.keys(statusCounts).map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Apply
            </button>
            {(fundFilter || statusFilter) && (
              <Link href="/milestones" className="text-sm font-medium text-blue-600 hover:underline">
                Clear
              </Link>
            )}
          </form>
          <Link
            href={exportUrl}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Export CSV
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {milestones.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              No milestones found for the selected filters.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Milestone</th>
                  <th className="px-5 py-3">Fund</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((milestone) => (
                  <tr key={milestone.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <Link
                        href={`/projects/${milestone.project.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {milestone.project.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{milestone.title}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {milestone.project.fund.name}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {milestone.status.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
