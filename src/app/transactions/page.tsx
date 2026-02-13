import Link from "next/link";
import prisma from "../../lib/prisma";
import { formatUsd, formatAda } from "../../lib/priceService";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ project?: string; fund?: string; type?: string }>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const projectFilter = params.project;
  const fundFilter = params.fund;
  const typeFilter = params.type;

  // Build where clause
  const where: Record<string, unknown> = {};
  if (projectFilter) where.projectId = projectFilter;
  if (typeFilter) where.txType = typeFilter;

  // Fund filter requires joining through project
  let projectIds: string[] | undefined;
  if (fundFilter) {
    const fundProjects = await prisma.project.findMany({
      where: { fundId: fundFilter },
      select: { id: true },
    });
    projectIds = fundProjects.map((p) => p.id);
    where.projectId = { in: projectIds };
  }

  const [transactions, stats, funds, txTypes] = await Promise.all([
    prisma.fundingTransaction.findMany({
      where,
      orderBy: { txDate: "desc" },
      take: 100,
      include: {
        project: {
          select: { id: true, title: true, fund: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.fundingTransaction.aggregate({
      where,
      _sum: { amount: true, usdValueAtTime: true },
      _count: true,
    }),
    prisma.fund.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.fundingTransaction.groupBy({
      by: ["txType"],
      _count: true,
    }),
  ]);

  // Group transactions by month for timeline
  const byMonth: Record<string, { count: number; amount: number; usd: number }> = {};
  for (const tx of transactions) {
    const month = tx.txDate.toISOString().slice(0, 7);
    if (!byMonth[month]) byMonth[month] = { count: 0, amount: 0, usd: 0 };
    byMonth[month].count++;
    byMonth[month].amount += Number(tx.amount);
    byMonth[month].usd += Number(tx.usdValueAtTime || 0);
  }

  const timelineData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  const maxAmount = Math.max(...timelineData.map(([, d]) => d.amount), 1);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Funding Transactions</h1>
          <p className="mt-2 text-sm text-slate-600">
            On-chain funding transactions for Catalyst projects
          </p>
        </header>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Transactions
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats._count}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total ADA
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {formatAda(Number(stats._sum.amount || 0))}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total USD (at time)
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {formatUsd(Number(stats._sum.usdValueAtTime || 0))}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Transaction Types
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {txTypes.map((t) => (
                <span
                  key={t.txType}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                >
                  {t.txType}: {t._count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        {timelineData.length > 0 && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Transaction Timeline</h2>
            <div className="flex items-end gap-2 h-32">
              {timelineData.map(([month, data]) => (
                <div key={month} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${(data.amount / maxAmount) * 100}%`, minHeight: "4px" }}
                    title={`${formatAda(data.amount)} (${data.count} txs)`}
                  />
                  <span className="mt-2 text-xs text-slate-500 rotate-45 origin-left">
                    {month.slice(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <form method="GET" className="flex flex-wrap items-center gap-3">
            <select
              name="fund"
              defaultValue={fundFilter || ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All Funds</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={typeFilter || ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="funding">Funding</option>
              <option value="milestone">Milestone</option>
              <option value="refund">Refund</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Filter
            </button>
            {(fundFilter || typeFilter) && (
              <Link
                href="/transactions"
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Clear filters
              </Link>
            )}
          </form>
        </div>

        {/* Transaction List */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Amount (ADA)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    USD Value
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                    Explorer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {tx.txDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/projects/${tx.project.id}`}
                          className="text-sm font-medium text-slate-900 hover:text-blue-600 line-clamp-1"
                        >
                          {tx.project.title}
                        </Link>
                        <p className="text-xs text-slate-400">{tx.project.fund.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            tx.txType === "funding"
                              ? "bg-emerald-100 text-emerald-700"
                              : tx.txType === "milestone"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tx.txType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                        {formatAda(Number(tx.amount))}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-600">
                        {tx.usdValueAtTime ? formatUsd(Number(tx.usdValueAtTime)) : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <a
                          href={tx.explorerUrl || `https://cardanoscan.io/transaction/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View ↗
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-slate-900">External Explorers</h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://cardanoscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
            >
              CardanoScan ↗
            </a>
            <a
              href="https://cexplorer.io"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
            >
              Cexplorer ↗
            </a>
            <a
              href="https://pool.pm"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
            >
              Pool.pm ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
