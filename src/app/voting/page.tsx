import Link from "next/link";

import prisma from "../../lib/prisma";
import RankingBadge from "../../components/RankingBadge";
import VotingStats from "../../components/VotingStats";
import VotingTrendsChart from "../../components/VotingTrendsChart";

export const revalidate = 300;

const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);

export default async function VotingAnalyticsPage() {
  const [records, fundStats] = await Promise.all([
    prisma.votingRecord.findMany({
      include: {
        project: { select: { id: true, title: true } },
        fund: { select: { id: true, name: true, number: true } },
      },
      orderBy: { yesVotes: "desc" },
      take: 100,
    }),
    prisma.votingRecord.groupBy({
      by: ["fundId"],
      _sum: { yesVotes: true, noVotes: true, abstainVotes: true },
      _count: { _all: true },
      _avg: { approvalRate: true },
    }),
  ]);

  const funds = await prisma.fund.findMany({
    where: { id: { in: fundStats.map((f) => f.fundId) } },
    select: { id: true, name: true, number: true },
  });

  const fundMap = new Map(funds.map((f) => [f.id, f]));

  const trendData = fundStats
    .map((stat) => {
      const fund = fundMap.get(stat.fundId);
      if (!fund) return null;
      return {
        fundName: fund.name,
        fundNumber: fund.number,
        totalYes: stat._sum.yesVotes ?? 0,
        totalNo: stat._sum.noVotes ?? 0,
        proposalCount: stat._count._all,
        avgApproval: stat._avg.approvalRate ?? 0,
      };
    })
    .filter(Boolean) as {
    fundName: string;
    fundNumber: number;
    totalYes: number;
    totalNo: number;
    proposalCount: number;
    avgApproval: number;
  }[];

  const categoryStats = await prisma.votingRecord.groupBy({
    by: ["category"],
    _sum: { yesVotes: true, noVotes: true },
    _count: { _all: true },
    _avg: { approvalRate: true },
    orderBy: { _sum: { yesVotes: "desc" } },
    take: 10,
  });

  const totalYes = records.reduce((sum, r) => sum + r.yesVotes, 0);
  const totalNo = records.reduce((sum, r) => sum + r.noVotes, 0);
  const avgApproval =
    records.length > 0
      ? records.reduce((sum, r) => sum + r.approvalRate, 0) / records.length
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Voting Analytics</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Fund-wide voting statistics and historical trends across Catalyst proposals.
          </p>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Total Proposals
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {formatNumber(records.length)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Total Yes Votes
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatNumber(totalYes)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Total No Votes
            </p>
            <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatNumber(totalNo)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Avg Approval Rate
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(avgApproval * 100)}%
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Historical Voting Trends
          </h2>
          <VotingTrendsChart data={trendData} />
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Top Categories by Yes Votes
            </h2>
            <div className="space-y-3">
              {categoryStats.map((cat, idx) => {
                const total = (cat._sum.yesVotes ?? 0) + (cat._sum.noVotes ?? 0);
                const yesPercent = total > 0 ? ((cat._sum.yesVotes ?? 0) / total) * 100 : 0;

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {idx + 1}. {cat.category}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatNumber(cat._sum.yesVotes ?? 0)} votes
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-full bg-emerald-500 dark:bg-emerald-400"
                        style={{ width: `${yesPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Top Proposals by Yes Votes
            </h2>
            <div className="space-y-3">
              {records.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${record.projectId}`}
                      className="block truncate font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {record.project.title}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {record.fund.name} · {record.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.fundRank && (
                      <RankingBadge rank={record.fundRank} label="Fund" size="sm" />
                    )}
                    <VotingStats
                      yesVotes={record.yesVotes}
                      noVotes={record.noVotes}
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-400 dark:text-slate-500">
          <p>Data refreshes every 5 minutes. Last updated at page load.</p>
        </footer>
      </div>
    </div>
  );
}
