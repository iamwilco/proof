import Link from "next/link";
import prisma from "../../lib/prisma";
import FlagActions from "./FlagActions";

export const revalidate = 30;

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  medium: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  critical: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  confirmed: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  dismissed: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  repeat_delays: "Repeat Delays",
  ghost_project: "Ghost Project",
  overdue_milestone: "Overdue Milestone",
  funding_cluster: "Funding Cluster",
  plagiarism: "Plagiarism",
  misleading_claims: "Misleading Claims",
  conflict_of_interest: "Conflict of Interest",
  fund_misuse: "Fund Misuse",
  similar_proposal: "Similar Proposal",
  other: "Other",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    category?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function FlagsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status || "pending";
  const category = params.category;
  const type = params.type;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (category) where.category = category;
  if (type) where.type = type;

  const [flags, total, stats] = await Promise.all([
    prisma.flag.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            fund: { select: { name: true } },
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.flag.count({ where }),
    prisma.flag.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const statusCounts = stats.reduce(
    (acc, s) => ({ ...acc, [s.status]: s._count._all }),
    { pending: 0, confirmed: 0, dismissed: 0, resolved: 0 } as Record<string, number>
  );

  const totalPages = Math.ceil(total / limit);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    if (overrides.status !== undefined) {
      if (overrides.status) newParams.set("status", overrides.status);
    } else if (status) {
      newParams.set("status", status);
    }
    if (overrides.category !== undefined) {
      if (overrides.category) newParams.set("category", overrides.category);
    } else if (category) {
      newParams.set("category", category);
    }
    if (overrides.type !== undefined) {
      if (overrides.type) newParams.set("type", overrides.type);
    } else if (type) {
      newParams.set("type", type);
    }
    if (overrides.page !== undefined) {
      if (overrides.page && overrides.page !== "1") newParams.set("page", overrides.page);
    }
    const qs = newParams.toString();
    return qs ? `/flags?${qs}` : "/flags";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Flag Review Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Review and manage flags raised by automated detection and community members.
          </p>
        </header>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {(["pending", "confirmed", "dismissed", "resolved"] as const).map((s) => (
            <Link
              key={s}
              href={buildUrl({ status: s, page: "1" })}
              className={`rounded-xl border p-4 transition-colors ${
                status === s
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{statusCounts[s]}</div>
              <div className="text-sm capitalize text-slate-600 dark:text-slate-400">{s}</div>
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Type:</span>
          <div className="flex gap-2">
            {[
              { value: "", label: "All" },
              { value: "automated", label: "Automated" },
              { value: "community", label: "Community" },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={buildUrl({ type: opt.value || undefined, page: "1" })}
                className={`rounded-full px-3 py-1 text-sm ${
                  (type || "") === opt.value
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>

          {category && (
            <Link
              href={buildUrl({ category: undefined, page: "1" })}
              className="ml-2 flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-sm text-blue-700 dark:text-blue-300"
            >
              {CATEGORY_LABELS[category] || category}
              <span className="ml-1">×</span>
            </Link>
          )}
        </div>

        {/* Flags Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          {flags.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              No flags found matching your filters.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((flag) => (
                  <tr key={flag.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-5 py-4">
                      <Link
                        href={`/projects/${flag.project.id}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {flag.project.title.length > 40
                          ? flag.project.title.slice(0, 40) + "..."
                          : flag.project.title}
                      </Link>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{flag.project.fund.name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={buildUrl({ category: flag.category, page: "1" })}
                        className="text-slate-700 dark:text-slate-300 hover:underline"
                      >
                        {CATEGORY_LABELS[flag.category] || flag.category}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          SEVERITY_COLORS[flag.severity] || "bg-slate-100 dark:bg-slate-700"
                        }`}
                      >
                        {flag.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs ${
                          flag.type === "automated" ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {flag.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[flag.status] || "bg-slate-100 dark:bg-slate-700"
                        }`}
                      >
                        {flag.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(flag.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <FlagActions flagId={flag.id} currentStatus={flag.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Showing {offset + 1}–{Math.min(offset + limit, total)} of {total} flags
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
