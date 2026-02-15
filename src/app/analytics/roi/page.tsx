import Link from "next/link";
import { Suspense } from "react";
import prisma from "../../../lib/prisma";
import ROIFilters from "./ROIFilters";

export const dynamic = "force-dynamic";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);

const getPercentileColor = (percentile: number | null) => {
  if (!percentile) return "text-slate-500";
  if (percentile >= 75) return "text-emerald-600";
  if (percentile >= 50) return "text-blue-600";
  if (percentile >= 25) return "text-amber-600";
  return "text-red-600";
};

const getScoreColor = (score: number) => {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-blue-500";
  if (score >= 30) return "bg-amber-500";
  return "bg-red-500";
};

interface FundROI {
  fundId: string;
  fundName: string;
  projectCount: number;
  avgROI: number;
  avgOutcome: number;
  totalFunding: number;
}

interface CategoryROI {
  category: string;
  projectCount: number;
  avgROI: number;
  avgOutcome: number;
  p25: number;
  p50: number;
  p75: number;
}

export default async function ROIDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ fund?: string; category?: string; status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const { fund, category, status, sort = "roi_desc" } = params;
  // Get filter options
  const [allFunds, allCategories] = await Promise.all([
    prisma.fund.findMany({ select: { id: true, name: true }, orderBy: { number: "desc" } }),
    prisma.project.findMany({ select: { category: true }, distinct: ["category"] }),
  ]);
  const categoryList = [...new Set(allCategories.map((p) => p.category))].sort();

  // Get all ROI scores with project data
  const roiScores = await prisma.projectROI.findMany({
    orderBy: { calculatedAt: "desc" },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          category: true,
          fundingAmount: true,
          status: true,
          fund: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Deduplicate to get latest ROI per project
  const latestByProject = new Map<string, typeof roiScores[0]>();
  for (const roi of roiScores) {
    if (!latestByProject.has(roi.projectId)) {
      latestByProject.set(roi.projectId, roi);
    }
  }
  let uniqueROIs = Array.from(latestByProject.values());

  // Apply filters
  if (fund) {
    uniqueROIs = uniqueROIs.filter((r) => r.project.fund.id === fund);
  }
  if (category) {
    uniqueROIs = uniqueROIs.filter((r) => r.project.category === category);
  }
  if (status) {
    uniqueROIs = uniqueROIs.filter((r) => r.project.status === status);
  }

  // Apply sorting
  switch (sort) {
    case "roi_asc":
      uniqueROIs.sort((a, b) => a.roiScore - b.roiScore);
      break;
    case "outcome_desc":
      uniqueROIs.sort((a, b) => b.outcomeScore - a.outcomeScore);
      break;
    case "funding_desc":
      uniqueROIs.sort((a, b) => Number(b.fundingAmount) - Number(a.fundingAmount));
      break;
    case "funding_asc":
      uniqueROIs.sort((a, b) => Number(a.fundingAmount) - Number(b.fundingAmount));
      break;
    case "community_desc":
      uniqueROIs.sort((a, b) => b.communityScore - a.communityScore);
      break;
    default:
      uniqueROIs.sort((a, b) => b.roiScore - a.roiScore);
  }

  // Calculate fund-level ROI
  const fundMap = new Map<string, FundROI>();
  for (const roi of uniqueROIs) {
    const fundId = roi.project.fund.id;
    const existing = fundMap.get(fundId) || {
      fundId,
      fundName: roi.project.fund.name,
      projectCount: 0,
      avgROI: 0,
      avgOutcome: 0,
      totalFunding: 0,
    };
    existing.projectCount++;
    existing.avgROI += roi.roiScore;
    existing.avgOutcome += roi.outcomeScore;
    existing.totalFunding += Number(roi.fundingAmount);
    fundMap.set(fundId, existing);
  }
  const fundROIs = Array.from(fundMap.values())
    .map((f) => ({
      ...f,
      avgROI: f.avgROI / f.projectCount,
      avgOutcome: f.avgOutcome / f.projectCount,
    }))
    .sort((a, b) => b.avgROI - a.avgROI);

  // Calculate category benchmarks
  const categoryMap = new Map<string, number[]>();
  for (const roi of uniqueROIs) {
    const scores = categoryMap.get(roi.project.category) || [];
    scores.push(roi.roiScore);
    categoryMap.set(roi.project.category, scores);
  }
  const categoryROIs: CategoryROI[] = Array.from(categoryMap.entries())
    .map(([category, scores]) => {
      scores.sort((a, b) => a - b);
      const avgROI = scores.reduce((a, b) => a + b, 0) / scores.length;
      const avgOutcome =
        uniqueROIs
          .filter((r) => r.project.category === category)
          .reduce((sum, r) => sum + r.outcomeScore, 0) / scores.length;
      return {
        category,
        projectCount: scores.length,
        avgROI,
        avgOutcome,
        p25: scores[Math.floor(scores.length * 0.25)] || 0,
        p50: scores[Math.floor(scores.length * 0.5)] || 0,
        p75: scores[Math.floor(scores.length * 0.75)] || 0,
      };
    })
    .sort((a, b) => b.avgROI - a.avgROI);

  // Top and bottom performers
  const sortedByROI = [...uniqueROIs].sort((a, b) => b.roiScore - a.roiScore);
  const topPerformers = sortedByROI.slice(0, 10);
  const bottomPerformers = sortedByROI.slice(-10).reverse();

  // Summary stats
  const totalProjects = uniqueROIs.length;
  const avgROI = totalProjects > 0
    ? uniqueROIs.reduce((sum, r) => sum + r.roiScore, 0) / totalProjects
    : 0;
  const avgOutcome = totalProjects > 0
    ? uniqueROIs.reduce((sum, r) => sum + r.outcomeScore, 0) / totalProjects
    : 0;
  const totalFunding = uniqueROIs.reduce((sum, r) => sum + Number(r.fundingAmount), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">ROI Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Return on investment analysis across funds and categories.
            </p>
          </div>
          <a
            href="/api/analytics/roi/export"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Export CSV
          </a>
        </header>

        {/* Filters */}
        <Suspense fallback={<div className="h-10" />}>
          <ROIFilters funds={allFunds} categories={categoryList} />
        </Suspense>

        {/* Summary Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Projects Analyzed
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{totalProjects}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Average ROI Score
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(avgROI)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Average Outcome
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(avgOutcome)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Funding
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalFunding)}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Fund-level ROI Comparison */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Fund ROI Comparison</h2>
            {fundROIs.length === 0 ? (
              <p className="text-sm text-slate-500">No ROI data available yet.</p>
            ) : (
              <div className="space-y-4">
                {fundROIs.map((fund) => (
                  <div key={fund.fundId} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">{fund.fundName}</p>
                        <p className="text-sm font-bold text-blue-600">
                          {formatNumber(fund.avgROI)}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${getScoreColor(fund.avgROI)}`}
                            style={{ width: `${Math.min(fund.avgROI, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {fund.projectCount} projects
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Benchmarks */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Category Benchmarks</h2>
            {categoryROIs.length === 0 ? (
              <p className="text-sm text-slate-500">No category data available yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-2 text-left font-medium text-slate-500">Category</th>
                      <th className="pb-2 text-right font-medium text-slate-500">Avg ROI</th>
                      <th className="pb-2 text-right font-medium text-slate-500">P50</th>
                      <th className="pb-2 text-right font-medium text-slate-500">P75</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryROIs.slice(0, 8).map((cat) => (
                      <tr key={cat.category} className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-900">{cat.category}</td>
                        <td className="py-2 text-right text-blue-600">{formatNumber(cat.avgROI)}</td>
                        <td className="py-2 text-right text-slate-600">{formatNumber(cat.p50)}</td>
                        <td className="py-2 text-right text-emerald-600">{formatNumber(cat.p75)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top & Bottom Performers */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Top 10 */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 p-6">
            <h2 className="mb-4 text-lg font-semibold text-emerald-900 dark:text-emerald-100">Top 10 Performers</h2>
            {topPerformers.length === 0 ? (
              <p className="text-sm text-emerald-700">No data available yet.</p>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((roi, idx) => (
                  <Link
                    key={roi.id}
                    href={`/projects/${roi.projectId}`}
                    className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {roi.project.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {roi.project.category} • {formatCurrency(Number(roi.fundingAmount))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{formatNumber(roi.roiScore)}</p>
                      <p className={`text-xs ${getPercentileColor(roi.overallPercentile)}`}>
                        P{Math.round(roi.overallPercentile || 0)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Bottom 10 */}
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-6">
            <h2 className="mb-4 text-lg font-semibold text-red-900 dark:text-red-100">Bottom 10 Performers</h2>
            {bottomPerformers.length === 0 ? (
              <p className="text-sm text-red-700">No data available yet.</p>
            ) : (
              <div className="space-y-3">
                {bottomPerformers.map((roi, idx) => (
                  <Link
                    key={roi.id}
                    href={`/projects/${roi.projectId}`}
                    className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {totalProjects - idx}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {roi.project.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {roi.project.category} • {formatCurrency(Number(roi.fundingAmount))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{formatNumber(roi.roiScore)}</p>
                      <p className={`text-xs ${getPercentileColor(roi.overallPercentile)}`}>
                        P{Math.round(roi.overallPercentile || 0)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Time-to-Delivery Analysis placeholder */}
        <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Time-to-Delivery Analysis</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Projects On-Time</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {uniqueROIs.filter((r) => r.deliverableScore >= 70).length}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Projects Delayed</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {uniqueROIs.filter((r) => r.deliverableScore >= 30 && r.deliverableScore < 70).length}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Projects At Risk</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {uniqueROIs.filter((r) => r.deliverableScore < 30).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
