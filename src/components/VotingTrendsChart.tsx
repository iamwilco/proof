"use client";

import { useMemo } from "react";

type TrendDataPoint = {
  fundName: string;
  fundNumber: number;
  totalYes: number;
  totalNo: number;
  proposalCount: number;
  avgApproval: number;
};

type VotingTrendsChartProps = {
  data: TrendDataPoint[];
};

export default function VotingTrendsChart({ data }: VotingTrendsChartProps) {
  const sortedData = useMemo(
    () => [...data].sort((a, b) => a.fundNumber - b.fundNumber),
    [data]
  );

  const maxVotes = useMemo(
    () => Math.max(...sortedData.map((d) => d.totalYes + d.totalNo), 1),
    [sortedData]
  );

  const formatNumber = (n: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);

  if (sortedData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No historical voting data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2" style={{ height: 200 }}>
        {sortedData.map((point) => {
          const total = point.totalYes + point.totalNo;
          const heightPercent = (total / maxVotes) * 100;
          const yesPercent = total > 0 ? (point.totalYes / total) * 100 : 0;

          return (
            <div
              key={point.fundNumber}
              className="group relative flex flex-1 flex-col items-center"
            >
              <div
                className="relative w-full overflow-hidden rounded-t-md bg-slate-100"
                style={{ height: `${heightPercent}%`, minHeight: 4 }}
              >
                <div
                  className="absolute bottom-0 left-0 w-full bg-emerald-500"
                  style={{ height: `${yesPercent}%` }}
                />
                <div
                  className="absolute top-0 left-0 w-full bg-rose-500"
                  style={{ height: `${100 - yesPercent}%` }}
                />
              </div>

              <div className="absolute -top-16 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-lg group-hover:block">
                <p className="font-semibold text-slate-800">{point.fundName}</p>
                <p className="text-emerald-600">Yes: {formatNumber(point.totalYes)}</p>
                <p className="text-rose-600">No: {formatNumber(point.totalNo)}</p>
                <p className="text-slate-500">
                  Approval: {Math.round(point.avgApproval * 100)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {sortedData.map((point) => (
          <div
            key={point.fundNumber}
            className="flex-1 text-center text-xs text-slate-500"
          >
            F{point.fundNumber}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-500" />
          <span className="text-slate-600">Yes Votes</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-rose-500" />
          <span className="text-slate-600">No Votes</span>
        </div>
      </div>
    </div>
  );
}
