"use client";

import { useState } from "react";
import Link from "next/link";

type ExportType = "projects" | "people" | "funds" | "graph";
type ExportFormat = "json" | "csv";

export default function ExportPage() {
  const [exportType, setExportType] = useState<ExportType>("projects");
  const [format, setFormat] = useState<ExportFormat>("json");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const url = `/api/export?type=${exportType}&format=${format}`;
      
      if (format === "csv") {
        const res = await fetch(url);
        const blob = await res.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${exportType}-export.csv`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      } else {
        const res = await fetch(url);
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${exportType}-export.json`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Export Data</h1>
          <p className="mt-2 text-base text-slate-600">
            Download Catalyst data for external analysis
          </p>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            {/* Export Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data Type
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(["projects", "people", "funds", "graph"] as ExportType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setExportType(type)}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      exportType === type
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Format
              </label>
              <div className="flex gap-3">
                {(["json", "csv"] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`rounded-lg border px-6 py-3 text-sm font-medium transition-colors ${
                      format === fmt
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="text-sm font-medium text-slate-900">What&apos;s included:</h3>
              <p className="mt-1 text-sm text-slate-600">
                {exportType === "projects" && "All proposals with funding amounts, status, team members, and fund association."}
                {exportType === "people" && "All individuals with proposal counts, funding totals, and completion rates."}
                {exportType === "funds" && "All funding rounds with statistics, awarded amounts, and completion rates."}
                {exportType === "graph" && "Network data (nodes and edges) for building knowledge graphs in external tools."}
              </p>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? "Exporting..." : `Download ${format.toUpperCase()}`}
            </button>
          </div>
        </div>

        {/* API Info */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">API Access</h2>
          <p className="mt-2 text-sm text-slate-600">
            You can also access data programmatically:
          </p>
          <div className="mt-4 space-y-2">
            <code className="block rounded bg-slate-100 px-3 py-2 text-sm text-slate-800">
              GET /api/export?type=projects&format=json
            </code>
            <code className="block rounded bg-slate-100 px-3 py-2 text-sm text-slate-800">
              GET /api/export?type=people&format=csv
            </code>
            <code className="block rounded bg-slate-100 px-3 py-2 text-sm text-slate-800">
              GET /api/export?type=graph&fund=FUND_ID
            </code>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/funds" className="text-sm text-blue-600 hover:underline">
            ← Back to Funds
          </Link>
        </div>
      </div>
    </div>
  );
}
