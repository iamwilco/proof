"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type MonthlyReport = {
  id: string;
  month: number;
  year: number;
  reporterName: string;
  summary: string;
  progress?: string | null;
  blockers?: string | null;
  nextSteps?: string | null;
  evidenceUrls: string[];
  status: string;
  createdAt: string;
};

interface ReportSectionProps {
  projectId: string;
  initialReports: MonthlyReport[];
}

export default function ReportSection({ projectId, initialReports }: ReportSectionProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reporterName, setReporterName] = useState("");
  const [summary, setSummary] = useState("");
  const [progress, setProgress] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [evidence, setEvidence] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const submitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          month,
          year,
          reporterName,
          summary,
          progress: progress || null,
          blockers: blockers || null,
          nextSteps: nextSteps || null,
          evidenceUrls: evidence
            .split("\n")
            .map((url) => url.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Unable to submit report" }));
        throw new Error(payload.error || "Unable to submit report");
      }

      const payload = await response.json();
      setReports([payload.report, ...reports]);
      setReporterName("");
      setSummary("");
      setProgress("");
      setBlockers("");
      setNextSteps("");
      setEvidence("");
      setStatus("success");
      setMessage("Report submitted.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit report");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Monthly Reports</h2>
          <p className="text-sm text-slate-500">Latest progress updates from project teams.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {reports.length} total
        </span>
      </div>

      <form onSubmit={submitReport} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Month
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {MONTHS.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Year
            <input
              type="number"
              min={2020}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Reporter Name
            <input
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={reporterName}
              onChange={(event) => setReporterName(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Summary
            <textarea
              required
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Progress Highlights
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={progress}
              onChange={(event) => setProgress(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Blockers
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={blockers}
              onChange={(event) => setBlockers(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Next Steps
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={nextSteps}
              onChange={(event) => setNextSteps(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Evidence URLs (one per line)
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Submitting..." : "Submit Report"}
          </button>
          {message && (
            <span
              className={`text-sm ${
                status === "error" ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {message}
            </span>
          )}
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {reports.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No monthly reports submitted yet.
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {MONTHS[report.month - 1]} {report.year}
                  </h3>
                  <p className="text-xs text-slate-500">Submitted by {report.reporterName}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {report.status.replace(/_/g, " ")}
                  </span>
                  <div className="mt-1 text-xs text-slate-400">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700">{report.summary}</p>
              {report.progress && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Progress:</span> {report.progress}
                </p>
              )}
              {report.blockers && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Blockers:</span> {report.blockers}
                </p>
              )}
              {report.nextSteps && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Next steps:</span> {report.nextSteps}
                </p>
              )}
              {report.evidenceUrls.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Evidence
                  </p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {report.evidenceUrls.map((url) => (
                      <li key={url} className="truncate">
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
