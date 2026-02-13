import Link from "next/link";
import prisma from "../../lib/prisma";

export const revalidate = 60;

const formatCurrency = (amount: number, currency: string) => {
  if (currency === "ADA") {
    return `₳${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number) => {
  return `${Math.round(value * 100)}%`;
};

type FundWithStats = {
  id: string;
  name: string;
  number: number;
  status: string;
  currency: string;
  proposalsCount: number;
  fundedProposalsCount: number;
  completedProposalsCount: number;
  totalBudget: number;
  totalAwarded: number;
  totalDistributed: number;
};

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

const FundCard = ({ fund }: { fund: FundWithStats }) => {
  const completionRate = fund.fundedProposalsCount > 0
    ? fund.completedProposalsCount / fund.fundedProposalsCount
    : 0;

  const fundingRate = fund.proposalsCount > 0
    ? fund.fundedProposalsCount / fund.proposalsCount
    : 0;

  const distributionRate = fund.totalAwarded > 0
    ? Number(fund.totalDistributed) / Number(fund.totalAwarded)
    : 0;

  return (
    <Link
      href={`/funds/${fund.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600">
            {fund.name}
          </h3>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            fund.status === "awarded" ? "bg-emerald-100 text-emerald-700" :
            fund.status === "active" ? "bg-blue-100 text-blue-700" :
            "bg-slate-100 text-slate-600"
          }`}>
            {fund.status}
          </span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(Number(fund.totalAwarded), fund.currency)}
          </p>
          <p className="text-xs text-slate-500">
            Total Awarded {fund.currency === "ADA" && <span className="text-slate-400">(ADA)</span>}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
        <div className="text-center">
          <p className="text-2xl font-semibold text-slate-900">{fund.proposalsCount}</p>
          <p className="text-xs text-slate-500">Proposals</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-emerald-600">{fund.fundedProposalsCount}</p>
          <p className="text-xs text-slate-500">Funded</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-blue-600">{fund.completedProposalsCount}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-600">Completion Rate</span>
            <span className="font-medium text-slate-900">{formatPercent(completionRate)}</span>
          </div>
          <ProgressBar value={fund.completedProposalsCount} max={fund.fundedProposalsCount} color="bg-emerald-500" />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-600">Funding Rate</span>
            <span className="font-medium text-slate-900">{formatPercent(fundingRate)}</span>
          </div>
          <ProgressBar value={fund.fundedProposalsCount} max={fund.proposalsCount} color="bg-blue-500" />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-600">Funds Distributed</span>
            <span className="font-medium text-slate-900">{formatPercent(distributionRate)}</span>
          </div>
          <ProgressBar value={Number(fund.totalDistributed)} max={Number(fund.totalAwarded)} color="bg-amber-500" />
        </div>
      </div>
    </Link>
  );
};

export default async function FundsPage() {
  const funds = await prisma.fund.findMany({
    where: { number: { gt: 0 } },
    orderBy: { number: "desc" },
  });

  const totalStats = {
    proposals: funds.reduce((sum, f) => sum + f.proposalsCount, 0),
    funded: funds.reduce((sum, f) => sum + f.fundedProposalsCount, 0),
    completed: funds.reduce((sum, f) => sum + f.completedProposalsCount, 0),
    awarded: funds.reduce((sum, f) => sum + Number(f.totalAwarded), 0),
    distributed: funds.reduce((sum, f) => sum + Number(f.totalDistributed), 0),
  };

  const overallCompletionRate = totalStats.funded > 0
    ? totalStats.completed / totalStats.funded
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Catalyst Funds</h1>
          <p className="mt-2 text-base text-slate-600">
            Explore funding rounds, completion rates, and transparency metrics.
          </p>
        </header>

        {/* Summary Stats */}
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Overall Statistics</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <p className="text-3xl font-bold text-slate-900">{funds.length}</p>
              <p className="text-sm text-slate-500">Funds</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{totalStats.proposals.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Proposals</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">{totalStats.funded.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Funded</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">{totalStats.completed.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">—</p>
              <p className="text-sm text-slate-500">Total Awarded (mixed currencies)</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{formatPercent(overallCompletionRate)}</p>
              <p className="text-sm text-slate-500">Completion Rate</p>
            </div>
          </div>
        </section>

        {/* Fund Cards */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {funds.map((fund) => (
            <FundCard
              key={fund.id}
              fund={{
                ...fund,
                totalBudget: Number(fund.totalBudget),
                totalAwarded: Number(fund.totalAwarded),
                totalDistributed: Number(fund.totalDistributed),
              }}
            />
          ))}
        </section>

        {funds.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-lg font-medium text-slate-600">No funds found</p>
            <p className="mt-1 text-sm text-slate-500">Run the ingestion script to populate data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
