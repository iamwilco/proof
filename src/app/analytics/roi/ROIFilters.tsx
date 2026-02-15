"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface ROIFiltersProps {
  funds: { id: string; name: string }[];
  categories: string[];
}

export default function ROIFilters({ funds, categories }: ROIFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFund = searchParams.get("fund") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "roi_desc";
  const currentStatus = searchParams.get("status") || "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/analytics/roi?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select
        value={currentFund}
        onChange={(e) => updateParams("fund", e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <option value="">All Funds</option>
        {funds.map((fund) => (
          <option key={fund.id} value={fund.id}>
            {fund.name}
          </option>
        ))}
      </select>

      <select
        value={currentCategory}
        onChange={(e) => updateParams("category", e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select
        value={currentStatus}
        onChange={(e) => updateParams("status", e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <option value="">All Statuses</option>
        <option value="complete">Complete</option>
        <option value="in_progress">In Progress</option>
        <option value="funded">Funded</option>
      </select>

      <select
        value={currentSort}
        onChange={(e) => updateParams("sort", e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <option value="roi_desc">ROI: High → Low</option>
        <option value="roi_asc">ROI: Low → High</option>
        <option value="outcome_desc">Outcome: High → Low</option>
        <option value="funding_desc">Funding: High → Low</option>
        <option value="funding_asc">Funding: Low → High</option>
        <option value="community_desc">Community: High → Low</option>
      </select>

      {(currentFund || currentCategory || currentStatus) && (
        <button
          onClick={() => router.push("/analytics/roi")}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
