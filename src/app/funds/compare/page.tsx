import React from "react";
import Link from "next/link";
import prisma from "../../../lib/prisma";

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ funds?: string }>;
}

const formatADA = (value: number) =>
  `₳${new Intl.NumberFormat("en-US", {
    notation: "compact",
  }).format(value)}`;

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export default async function FundComparisonPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedFundIds = params.funds?.split(",").filter(Boolean) || [];

  const allFunds = await prisma.fund.findMany({
    where: { number: { gt: 0 } },
    orderBy: { number: "desc" },
    select: {
      id: true,
      name: true,
      number: true,
      totalBudget: true,
      totalAwarded: true,
      totalDistributed: true,
      proposalsCount: true,
      fundedProposalsCount: true,
      completedProposalsCount: true,
    },
  });

  const selectedFunds =
    selectedFundIds.length > 0
      ? allFunds.filter((f) => selectedFundIds.includes(f.id))
      : allFunds.slice(0, 3);

  const categoryData = await Promise.all(
    selectedFunds.map(async (fund) => {
      const categories = await prisma.project.groupBy({
        by: ["category"],
        where: { fundId: fund.id },
        _count: { _all: true },
        _sum: { fundingAmount: true },
      });
      return {
        fundId: fund.id,
        categories: categories.map((c) => ({
          category: c.category,
          count: c._count._all,
          funding: Number(c._sum.fundingAmount || 0),
        })),
      };
    })
  );

  const categoryMap = new Map(categoryData.map((c) => [c.fundId, c.categories]));

  const allCategories = [
    ...new Set(categoryData.flatMap((c) => c.categories.map((cat) => cat.category))),
  ].sort();

  const metrics = selectedFunds.map((fund) => {
    const completionRate =
      fund.fundedProposalsCount > 0
        ? (fund.completedProposalsCount / fund.fundedProposalsCount) * 100
        : 0;
    const fundingRate =
      fund.proposalsCount > 0
        ? (fund.fundedProposalsCount / fund.proposalsCount) * 100
        : 0;
    const disbursementRate =
      Number(fund.totalAwarded) > 0
        ? (Number(fund.totalDistributed) / Number(fund.totalAwarded)) * 100
        : 0;
    const avgProjectSize =
      fund.fundedProposalsCount > 0
        ? Number(fund.totalAwarded) / fund.fundedProposalsCount
        : 0;

    return {
      fund,
      completionRate,
      fundingRate,
      disbursementRate,
      avgProjectSize,
      categories: categoryMap.get(fund.id) || [],
    };
  });

  const buildUrl = (fundIds: string[]) => {
    return `/funds/compare?funds=${fundIds.join(",")}`;
  };

  const exportUrl = `/api/export?type=fund-comparison&funds=${selectedFunds.map((f) => f.id).join(",")}`;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fund Comparison</h1>
            <p className="mt-2 text-sm text-slate-600">
              Compare metrics across multiple Catalyst funds.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/funds"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              All Funds
            </Link>
            <a
              href={exportUrl}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Export CSV
            </a>
          </div>
        </header>

        {/* Fund Selector */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Select Funds to Compare</h2>
          <div className="flex flex-wrap gap-2">
            {allFunds.map((fund) => {
              const isSelected = selectedFunds.some((f) => f.id === fund.id);
              const newSelection = isSelected
                ? selectedFunds.filter((f) => f.id !== fund.id).map((f) => f.id)
                : [...selectedFunds.map((f) => f.id), fund.id];

              return (
                <Link
                  key={fund.id}
                  href={buildUrl(newSelection)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {fund.name}
                </Link>
              );
            })}
          </div>
        </div>

        {selectedFunds.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">Select at least one fund to compare.</p>
          </div>
        ) : (
          <>
            {/* Comparison Table */}
            <div className="mb-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Metric
                    </th>
                    {selectedFunds.map((fund) => (
                      <th
                        key={fund.id}
                        className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {fund.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      Total Budget
                    </td>
                    {metrics.map((m) => (
                      <td key={m.fund.id} className="px-6 py-4 text-right text-sm text-slate-900">
                        {formatADA(Number(m.fund.totalBudget))}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      Total Awarded
                    </td>
                    {metrics.map((m) => (
                      <td key={m.fund.id} className="px-6 py-4 text-right text-sm text-slate-900">
                        {formatADA(Number(m.fund.totalAwarded))}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      Total Distributed
                    </td>
                    {metrics.map((m) => (
                      <td key={m.fund.id} className="px-6 py-4 text-right text-sm text-emerald-600 font-medium">
                        {formatADA(Number(m.fund.totalDistributed))}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      Proposals Submitted
                    </td>
                    {metrics.map((m) => (
                      <td key={m.fund.id} className="px-6 py-4 text-right text-sm text-slate-900">
                        {m.fund.proposalsCount}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      Proposals Funded
                    </td>
                    {metrics.map((m) => (
                      <td key={m.fund.id} className="px-6 py-4 text-right text-sm text-slate-900">
                        {m.fund.fundedProposalsCount}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      Funding Rate
                    </td>
                    {metrics.map((m) => (
                      <td key={m.fund.id} className="px-6 py-4 text-right text-sm text-slate-900">
                        {formatPercent(m.fundingRate)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      Completion Rate
                    </td>
                    {metrics.map((m) => (
                      <td
                        key={m.fund.id}
                        className={`px-6 py-4 text-right text-sm font-medium ${
                          m.completionRate >= 70
                            ? "text-emerald-600"
                            : m.completionRate >= 40
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {formatPercent(m.completionRate)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      Disbursement Rate
                    </td>
                    {metrics.map((m) => (
                      <td key={m.fund.id} className="px-6 py-4 text-right text-sm text-slate-900">
                        {formatPercent(m.disbursementRate)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      Avg Project Size
                    </td>
                    {metrics.map((m) => (
                      <td key={m.fund.id} className="px-6 py-4 text-right text-sm text-slate-900">
                        {formatADA(m.avgProjectSize)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Category Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Category
                      </th>
                      {selectedFunds.map((fund) => (
                        <th
                          key={fund.id}
                          className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                          colSpan={2}
                        >
                          {fund.name}
                        </th>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      <th></th>
                      {selectedFunds.map((fund) => (
                        <React.Fragment key={fund.id}>
                          <th className="px-4 py-2 text-right">Count</th>
                          <th className="px-4 py-2 text-right">Funding</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allCategories.slice(0, 10).map((category) => (
                      <tr key={category}>
                        <td className="px-4 py-3 text-sm text-slate-700">{category}</td>
                        {metrics.map((m) => {
                          const cat = m.categories.find((c) => c.category === category);
                          return (
                            <React.Fragment key={m.fund.id}>
                              <td className="px-4 py-3 text-right text-sm text-slate-600">
                                {cat?.count || 0}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-slate-600">
                                {cat ? formatADA(cat.funding) : "-"}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
