"use client";

import { useMemo } from "react";

type VotingStatsProps = {
  yesVotes: number;
  noVotes: number;
  abstainVotes?: number;
  uniqueWallets?: number;
  approvalRate?: number;
  fundRank?: number | null;
  categoryRank?: number | null;
  compact?: boolean;
};

export default function VotingStats({
  yesVotes,
  noVotes,
  abstainVotes = 0,
  uniqueWallets,
  approvalRate,
  fundRank,
  categoryRank,
  compact = false,
}: VotingStatsProps) {
  const totalVotes = yesVotes + noVotes;
  const computedApproval = useMemo(() => {
    if (approvalRate !== undefined) return approvalRate;
    return totalVotes > 0 ? yesVotes / totalVotes : 0;
  }, [approvalRate, yesVotes, totalVotes]);

  const yesPercent = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
  const noPercent = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0;

  const formatNumber = (n: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-emerald-600">{formatNumber(yesVotes)} Yes</span>
        <span className="text-slate-400">/</span>
        <span className="font-medium text-rose-600">{formatNumber(noVotes)} No</span>
        <span className="ml-1 text-slate-500">
          ({Math.round(computedApproval * 100)}%)
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Voting Results</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            computedApproval >= 0.5
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {Math.round(computedApproval * 100)}% Approval
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="bg-rose-500 transition-all"
            style={{ width: `${noPercent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Yes: {formatNumber(yesVotes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-slate-600">No: {formatNumber(noVotes)}</span>
          </div>
          {abstainVotes > 0 && (
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
              <span className="text-slate-600">Abstain: {formatNumber(abstainVotes)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-4">
        {uniqueWallets !== undefined && (
          <div>
            <p className="text-xs text-slate-400">Unique Wallets</p>
            <p className="text-sm font-semibold text-slate-800">
              {formatNumber(uniqueWallets)}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-slate-400">Total Votes</p>
          <p className="text-sm font-semibold text-slate-800">
            {formatNumber(totalVotes)}
          </p>
        </div>
        {fundRank && (
          <div>
            <p className="text-xs text-slate-400">Fund Rank</p>
            <p className="text-sm font-semibold text-slate-800">#{fundRank}</p>
          </div>
        )}
        {categoryRank && (
          <div>
            <p className="text-xs text-slate-400">Category Rank</p>
            <p className="text-sm font-semibold text-slate-800">#{categoryRank}</p>
          </div>
        )}
      </div>
    </div>
  );
}
