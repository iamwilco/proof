import Link from "next/link";

import prisma from "../../lib/prisma";
import ReportActions from "./ReportActions";

export const revalidate = 60;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  flagged: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
};

interface PageProps {
  searchParams: Promise<{ status?: string; fund?: string }>;
}

export default async function ReportsDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status || "pending";
  const fund = params.fund || "";

  const where: Record<string, unknown> = {};
  if (status && status !== "all") {
    where.status = status;
  }
  if (fund) {
    where.project = { fundId: fund };
  }

  const [reports, stats, funds] = await Promise.all([
    prisma.monthlyReport.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            fund: { select: { name: true } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 200,
    }),
    prisma.monthlyReport.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.fund.findMany({
      where: { number: { gt: 0 } },
      select: { id: true, name: true, number: true },
      orderBy: { number: "desc" },
    }),
  ]);

  const statusCounts = stats.reduce(
    (acc, row) => ({ ...acc, [row.status]: row._count._all }),
    { pending: 0, approved: 0, flagged: 0 } as Record<string, number>
  );

  const buildUrl = (overrides: { status?: string; fund?: string }) => {
    const nextParams = new URLSearchParams();
    const nextStatus = overrides.status ?? status;
    const nextFund = overrides.fund ?? fund;
    if (nextStatus && nextStatus !== "all") nextParams.set("status", nextStatus);
    if (nextFund) nextParams.set("fund", nextFund);
    const qs = nextParams.toString();
    return qs ? `/reports?${qs}` : "/reports";
  };

  const exportUrl = `/api/export?type=reports&format=csv${
    fund ? `&fund=${fund}` : ""
  }${status && status !== "all" ? `&status=${status}` : ""}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Monthly Reports Moderation</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Review team-submitted monthly progress updates.
          </p>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {(["pending", "approved", "flagged"] as const).map((key) => (
            <Link
              key={key}
              href={buildUrl({ status: key })}
              className={`rounded-xl border p-4 transition-colors ${
                status === key
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {statusCounts[key] || 0}
              </div>
              <div className="text-sm capitalize text-slate-600 dark:text-slate-400">{key}</div>
            </Link>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <form method="GET" action="/reports" className="flex flex-wrap items-center gap-3">
            <select
              name="fund"
              defaultValue={fund}
              className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Funds</option>
              {funds.map((fundItem) => (
                <option key={fundItem.id} value={fundItem.id}>
                  {fundItem.name}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All statuses</option>
              {(["pending", "approved", "flagged"] as const).map((value) => (
                <option key={value} value={value}>
                  {value.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-slate-700 dark:bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-slate-500"
            >
              Apply
            </button>
            {(fund || status !== "pending") && (
              <Link href="/reports" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Clear
              </Link>
            )}
          </form>
          <Link
            href={exportUrl}
            className="rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
          >
            Export CSV
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          {reports.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              No reports found for the selected filters.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Reporter</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-5 py-4">
                      <Link
                        href={`/projects/${report.project.id}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {report.project.title}
                      </Link>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {report.project.fund?.name ?? "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {report.month}/{report.year}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{report.reporterName}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[report.status] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <ReportActions reportId={report.id} status={report.status} />
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
