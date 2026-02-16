import Link from "next/link";

export const metadata = {
  title: "Limitations - PROOF Documentation",
  description: "Current limitations and known issues",
};

const limitations = [
  {
    category: "Data Sources",
    items: [
      {
        title: "Milestones API Unavailable",
        issue: "The official milestones.projectcatalyst.io does not have a public API.",
        impact: "Milestone data requires manual JSON export or scraping. Updates are not real-time.",
        workaround: "Ingestion script reads from local JSON file. Data must be manually obtained.",
        status: "planned",
      },
      {
        title: "Rate Limits on External APIs",
        issue: "GitHub (5,000/hr), Blockfrost (50,000/day free tier), Catalyst Explorer (unknown).",
        impact: "Large-scale scans may be throttled. Occasional 429 errors during full ingestion.",
        workaround: "Request queuing with exponential backoff and caching.",
        status: "mitigated",
      },
      {
        title: "Historical Data Gaps",
        issue: "Data from early Catalyst funds (F1-F5) is incomplete.",
        impact: "Some proposal descriptions, team details, and milestones missing.",
        workaround: "Best-effort ingestion; gaps marked as 'data unavailable'.",
        status: "known",
      },
    ],
  },
  {
    category: "Identity Resolution",
    items: [
      {
        title: "Fuzzy Matching Accuracy",
        issue: "Identity resolution uses 86% similarity threshold which has limitations.",
        impact: "False positives ('John Smith' merged with 'Jonathan Smith') and false negatives possible.",
        workaround: "Manual merge capability for admins. Alias tracking. Confidence scores displayed.",
        status: "mitigated",
      },
      {
        title: "Dispute Workflow Incomplete",
        issue: "Accountability score dispute process is designed but not fully implemented.",
        impact: "Manual moderator review required for disputes.",
        workaround: "Users can submit disputes; moderators handle manually.",
        status: "in-progress",
      },
    ],
  },
  {
    category: "Scoring",
    items: [
      {
        title: "ROI Score Caveats",
        issue: "ROI scoring cannot measure real-world impact, user satisfaction, or indirect benefits.",
        impact: "Scores are relative indicators, not absolute measures of value.",
        workaround: "Display methodology and confidence levels prominently.",
        status: "known",
      },
      {
        title: "GitHub Score Biases",
        issue: "Not all valuable projects are GitHub-centric.",
        impact: "Research, community, design projects may score lower.",
        workaround: "Alternative activity sources planned (Notion, Figma, etc.).",
        status: "planned",
      },
      {
        title: "New Proposer Problem",
        issue: "First-time proposers have no history.",
        impact: "Default 'UNPROVEN' badge may seem unfair.",
        workaround: "Don't penalize for lack of history. Display confidence level.",
        status: "mitigated",
      },
    ],
  },
  {
    category: "Technical",
    items: [
      {
        title: "Graph Performance",
        issue: "Network graph degrades with >500 nodes.",
        impact: "Large graphs may be slow or unusable.",
        workaround: "Filter to fewer node types. Use desktop browser.",
        status: "known",
      },
      {
        title: "Limited Mobile Experience",
        issue: "No native app. Network graph nearly unusable on mobile.",
        impact: "Mobile users have reduced functionality.",
        workaround: "Use desktop for full experience.",
        status: "known",
      },
      {
        title: "No Real-Time Updates",
        issue: "Data is refreshed periodically, not in real-time.",
        impact: "New proposals may not appear immediately.",
        workaround: "Staleness indicators planned.",
        status: "planned",
      },
    ],
  },
];

const knownBugs = [
  { issue: "Graph occasionally fails to render", status: "Investigating", workaround: "Refresh page" },
  { issue: "Some accountability scores not calculating", status: "In progress", workaround: "Manual recalculation" },
  { issue: "Duplicate person entries", status: "Known", workaround: "Admin merge tool" },
  { issue: "Milestone dates showing UTC offset", status: "Planned fix", workaround: "None" },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    known: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    mitigated: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    planned: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[status] || colors.known}`}>
      {status}
    </span>
  );
}

export default function LimitationsPage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">
          Documentation
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Limitations</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Current Limitations
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Known issues, constraints, and planned improvements
      </p>

      {limitations.map((section) => (
        <section key={section.category} className="mb-10">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            {section.category}
          </h2>
          <div className="space-y-4">
            {section.items.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-slate-700 dark:text-slate-300">Issue:</span>{" "}
                    <span className="text-slate-600 dark:text-slate-400">{item.issue}</span>
                  </p>
                  <p><span className="font-medium text-slate-700 dark:text-slate-300">Impact:</span>{" "}
                    <span className="text-slate-600 dark:text-slate-400">{item.impact}</span>
                  </p>
                  <p><span className="font-medium text-slate-700 dark:text-slate-300">Workaround:</span>{" "}
                    <span className="text-slate-600 dark:text-slate-400">{item.workaround}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Known Bugs */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Known Bugs
        </h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Issue</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Workaround</th>
              </tr>
            </thead>
            <tbody>
              {knownBugs.map((bug, idx) => (
                <tr key={idx} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3 text-slate-900 dark:text-white">{bug.issue}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{bug.status}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{bug.workaround}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Report Issues */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6">
        <h2 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
          Found an issue?
        </h2>
        <p className="text-amber-800 dark:text-amber-300 text-sm mb-4">
          Help us improve by reporting bugs or data errors.
        </p>
        <div className="flex gap-3">
          <Link
            href="/contact"
            className="inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition"
          >
            Report Bug
          </Link>
        </div>
      </div>
    </div>
  );
}
