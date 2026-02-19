"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface ProposalSection {
  label: string;
  content: string;
}

interface MilestoneData {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  somStatus: string | null;
  poaStatus: string | null;
  description: string | null;
  evidenceUrls: string[];
  deliverables: {
    id: string;
    title: string;
    status: string;
  }[];
}

/**
 * Clean raw proposal text: strip HTML tags, fix markdown artifacts
 */
function cleanContent(raw: string): string {
  return raw
    // Remove HTML tags like <u>, </u>, <br>, <b>, etc.
    .replace(/<\/?[^>]+(>|$)/g, "")
    // Remove leftover ** around already-removed HTML
    .replace(/\*\*\s*\*\*/g, "")
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    in_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    pending: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  };
  const c = colors[status.toLowerCase()] ?? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ProposalDetails({
  sections,
}: {
  sections: ProposalSection[];
}) {
  const [activeTab, setActiveTab] = useState(0);

  if (sections.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex overflow-x-auto">
          {sections.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setActiveTab(i)}
              className={`shrink-0 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === i
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6">
        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          <ReactMarkdown>{cleanContent(sections[activeTab].content)}</ReactMarkdown>
        </div>
      </div>
    </section>
  );
}

export function MilestoneTabs({
  milestones,
}: {
  milestones: MilestoneData[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (milestones.length === 0) return null;

  const milestone = milestones[activeIdx];

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <div className="border-b border-slate-200 dark:border-slate-700 px-6 pt-4 pb-0">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Milestones</h2>
        <nav className="flex gap-1 overflow-x-auto pb-0">
          {milestones.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeIdx === i
                  ? "bg-white dark:bg-slate-800 border border-b-0 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white -mb-px"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              M{i + 1}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {milestone.title}
            </h3>
            {milestone.dueDate && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Due: {new Date(milestone.dueDate).toLocaleDateString("en-GB", { dateStyle: "medium" })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={milestone.status} />
            {milestone.somStatus && (
              <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                SoM: {milestone.somStatus.replace(/_/g, " ")}
              </span>
            )}
            {milestone.poaStatus && (
              <span className="rounded-full bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                PoA: {milestone.poaStatus.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>

        {milestone.description && (
          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none mb-4">
            <ReactMarkdown>{cleanContent(milestone.description)}</ReactMarkdown>
          </div>
        )}

        {milestone.deliverables.length > 0 && (
          <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Deliverables
            </p>
            <ul className="space-y-1.5">
              {milestone.deliverables.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{d.title}</span>
                  <StatusPill status={d.status} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {milestone.evidenceUrls.length > 0 && (
          <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Evidence
            </p>
            <ul className="space-y-1 text-sm">
              {milestone.evidenceUrls.map((url) => (
                <li key={url} className="truncate">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-3 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span>Progress</span>
          <span>
            {milestones.filter((m) => ["completed", "complete"].includes(m.status.toLowerCase())).length} / {milestones.length} completed
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-1.5 rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${(milestones.filter((m) => ["completed", "complete"].includes(m.status.toLowerCase())).length / milestones.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
