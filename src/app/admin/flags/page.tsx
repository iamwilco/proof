"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Flag {
  id: string;
  projectId: string;
  userId: string | null;
  type: "automated" | "community";
  category: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  evidenceUrl: string | null;
  metadata: Record<string, unknown> | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  project: {
    id: string;
    title: string;
    fund: { name: string };
  };
  user: { id: string; displayName: string } | null;
}

interface FlagStats {
  pending?: number;
  confirmed?: number;
  dismissed?: number;
  resolved?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  repeat_delays: "Repeat Delays",
  ghost_project: "Ghost Project",
  overdue_milestone: "Overdue Milestone",
  funding_cluster: "Funding Cluster",
  similar_proposal: "Similar Proposal",
  plagiarism: "Plagiarism",
  misleading_claims: "Misleading Claims",
  conflict_of_interest: "Conflict of Interest",
  fund_misuse: "Fund Misuse",
  abandoned: "Abandoned",
  quality: "Quality Issues",
  other: "Other",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-yellow-100 text-yellow-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800",
  critical: "bg-red-200 text-red-900",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-800",
  confirmed: "bg-red-100 text-red-800",
  dismissed: "bg-slate-100 text-slate-600",
  resolved: "bg-green-100 text-green-800",
};

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [stats, setStats] = useState<FlagStats>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status: string;
    type: string;
    category: string;
  }>({ status: "pending", type: "", category: "" });
  const [, setSelectedFlag] = useState<Flag | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchFlags = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.set("status", filter.status);
      if (filter.type) params.set("type", filter.type);
      if (filter.category) params.set("category", filter.category);

      const res = await fetch(`/api/flags?${params.toString()}`);
      const data = await res.json();
      setFlags(data.flags || []);
      setStats(data.stats || {});
      setTotal(data.total || 0);
      setLoading(false);
    };
    fetchFlags();
  }, [filter]);

  const handleAction = async (flagId: string, newStatus: string) => {
    setActionLoading(true);
    await fetch("/api/flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagId, status: newStatus, reviewedBy: "admin" }),
    });
    setSelectedFlag(null);
    // Trigger refetch by updating filter
    setFilter((f) => ({ ...f }));
    setActionLoading(false);
  };

  const runDetection = async () => {
    setActionLoading(true);
    await fetch("/api/admin/flags/detect", { method: "POST" });
    // Trigger refetch by updating filter
    setFilter((f) => ({ ...f }));
    setActionLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Flag Review Queue</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review and moderate community and automated flags.
            </p>
          </div>
          <button
            onClick={runDetection}
            disabled={actionLoading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Run Detection
          </button>
        </header>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {(["pending", "confirmed", "dismissed", "resolved"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter((f) => ({ ...f, status }))}
              className={`rounded-xl border p-4 text-left transition ${
                filter.status === status
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {status}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats[status] || 0}
              </p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            value={filter.type}
            onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="automated">Automated</option>
            <option value="community">Community</option>
          </select>
          <select
            value={filter.category}
            onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Flags List */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">Loading flags...</p>
          </div>
        ) : flags.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">No flags matching the current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          SEVERITY_COLORS[flag.severity] || "bg-slate-100"
                        }`}
                      >
                        {flag.severity}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[flag.status] || "bg-slate-100"
                        }`}
                      >
                        {flag.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {flag.type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {CATEGORY_LABELS[flag.category] || flag.category}
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold text-slate-900">{flag.title}</h3>
                    <Link
                      href={`/projects/${flag.projectId}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {flag.project.title}
                    </Link>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                      {flag.description}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                      <span>Created {new Date(flag.createdAt).toLocaleDateString()}</span>
                      {flag.user && <span>by {flag.user.displayName}</span>}
                      {flag.evidenceUrl && (
                        <a
                          href={flag.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Evidence
                        </a>
                      )}
                    </div>
                  </div>
                  {flag.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(flag.id, "confirmed")}
                        disabled={actionLoading}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleAction(flag.id, "dismissed")}
                        disabled={actionLoading}
                        className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                  {flag.status === "confirmed" && (
                    <button
                      onClick={() => handleAction(flag.id, "resolved")}
                      disabled={actionLoading}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Showing {flags.length} of {total} flags
        </p>
      </div>
    </div>
  );
}
