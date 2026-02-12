import Link from "next/link";
import prisma from "../../../lib/prisma";

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ fund?: string; sort?: string }>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
  }).format(value);

const RankBadge = ({ rank }: { rank: number }) => {
  const colors: Record<number, string> = {
    1: "bg-amber-400 text-amber-900",
    2: "bg-slate-300 text-slate-700",
    3: "bg-orange-300 text-orange-800",
  };
  const colorClass = colors[rank] ?? "bg-slate-100 text-slate-600";

  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}
    >
      {rank}
    </span>
  );
};

export default async function ProposerLeaderboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const fundFilter = params.fund ?? "";
  const sortBy = params.sort ?? "funding";

  const funds = await prisma.fund.findMany({
    where: { number: { gt: 0 } },
    select: { id: true, name: true, number: true },
    orderBy: { number: "desc" },
  });

  const proposers = await prisma.person.findMany({
    where: fundFilter
      ? {
          projectPeople: {
            some: {
              project: { fundId: fundFilter },
            },
          },
        }
      : undefined,
    include: {
      projectPeople: {
        include: {
          project: {
            select: {
              id: true,
              status: true,
              fundingAmount: true,
              fundId: true,
            },
          },
        },
      },
    },
  });

  const proposersWithStats = proposers
    .map((person) => {
      const projects = fundFilter
        ? person.projectPeople.filter((pp) => pp.project.fundId === fundFilter)
        : person.projectPeople;

      const totalFunding = projects.reduce(
        (sum, pp) => sum + Number(pp.project.fundingAmount),
        0
      );
      const fundedCount = projects.length;
      const completedCount = projects.filter(
        (pp) => pp.project.status === "completed"
      ).length;
      const completionRate =
        fundedCount > 0 ? (completedCount / fundedCount) * 100 : 0;

      return {
        ...person,
        totalFunding,
        fundedCount,
        completedCount,
        completionRate,
      };
    })
    .filter((p) => p.fundedCount > 0);

  const sortedProposers = [...proposersWithStats].sort((a, b) => {
    switch (sortBy) {
      case "funding":
        return b.totalFunding - a.totalFunding;
      case "completion":
        return b.completionRate - a.completionRate;
      case "projects":
        return b.fundedCount - a.fundedCount;
      default:
        return b.totalFunding - a.totalFunding;
    }
  });

  const top50 = sortedProposers.slice(0, 50);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/rankings" className="hover:text-blue-600">
              Rankings
            </Link>
            <span>/</span>
            <span className="text-slate-900">Proposers</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Proposer Leaderboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Top proposers ranked by funding, completion rate, and project count.
          </p>
        </header>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Fund:</span>
            <div className="flex gap-1">
              <Link
                href={`/rankings/proposers?sort=${sortBy}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  !fundFilter
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                All Funds
              </Link>
              {funds.slice(0, 5).map((fund) => (
                <Link
                  key={fund.id}
                  href={`/rankings/proposers?fund=${fund.id}&sort=${sortBy}`}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    fundFilter === fund.id
                      ? "bg-blue-100 text-blue-700"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {fund.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sort Tabs */}
        <div className="mb-6 flex gap-2">
          {[
            { key: "funding", label: "Total Funding" },
            { key: "completion", label: "Completion Rate" },
            { key: "projects", label: "Project Count" },
          ].map((option) => (
            <Link
              key={option.key}
              href={`/rankings/proposers?${fundFilter ? `fund=${fundFilter}&` : ""}sort=${option.key}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                sortBy === option.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          {top50.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No proposers found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {top50.map((proposer, index) => (
                <Link
                  key={proposer.id}
                  href={`/people/${proposer.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50"
                >
                  <RankBadge rank={index + 1} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {proposer.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {proposer.fundedCount} projects • {proposer.completedCount} completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {sortBy === "completion"
                        ? `${proposer.completionRate.toFixed(0)}%`
                        : sortBy === "projects"
                          ? proposer.fundedCount
                          : formatCurrency(proposer.totalFunding)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {sortBy === "completion"
                        ? "completion"
                        : sortBy === "projects"
                          ? "projects"
                          : "total funded"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Proposers
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {proposersWithStats.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Funding
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(
                proposersWithStats.reduce((sum, p) => sum + p.totalFunding, 0)
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Avg Completion Rate
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {proposersWithStats.length > 0
                ? (
                    proposersWithStats.reduce((sum, p) => sum + p.completionRate, 0) /
                    proposersWithStats.length
                  ).toFixed(0)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
