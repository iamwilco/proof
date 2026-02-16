import Link from "next/link";

export const metadata = {
  title: "Features - PROOF Documentation",
  description: "Complete feature list for PROOF",
};

const publicFeatures = [
  { name: "Projects Directory", path: "/projects", desc: "Search and filter all Catalyst proposals by fund, status, category" },
  { name: "Project Detail Pages", path: "/projects/[id]", desc: "Full proposal info, milestones, team, voting results, external links" },
  { name: "People Profiles", path: "/people/[id]", desc: "Individual proposer history, projects, accountability score" },
  { name: "Organization Profiles", path: "/organizations/[id]", desc: "Company/team pages with aggregated stats" },
  { name: "Fund Overview", path: "/funds/[id]", desc: "Per-fund stats, budget allocation, completion rates" },
  { name: "Network Graph", path: "/graph", desc: "Interactive visualization of relationships" },
  { name: "Rankings", path: "/rankings", desc: "Top projects and people by funding, completion, ROI" },
  { name: "Voting Analytics", path: "/voting", desc: "Historical voting trends, approval rates" },
  { name: "Milestone Dashboard", path: "/milestones", desc: "Overview of all milestone statuses" },
];

const authFeatures = [
  { name: "Community Reviews", desc: "Write detailed reviews with ratings for any project" },
  { name: "Concerns Submission", desc: "Flag specific issues with evidence" },
  { name: "Project Bookmarks", desc: "Save projects to personal lists" },
  { name: "Reputation Building", desc: "Earn reputation through helpful contributions" },
  { name: "Monthly Reports", desc: "Submit progress updates (for project owners)" },
];

const adminFeatures = [
  { name: "Flag Review Queue", desc: "Review and resolve automated and community flags" },
  { name: "Report Moderation", desc: "Approve/reject monthly reports" },
  { name: "Connection Management", desc: "Create verified links between entities" },
  { name: "Data Health Dashboard", desc: "Monitor data quality and ingestion status" },
  { name: "User Management", desc: "Manage roles, handle disputes" },
];

export default function FeaturesPage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">
          Documentation
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Features</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Features Overview
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Everything PROOF offers for transparency and accountability
      </p>

      {/* Public Features */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Public Features
          <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
            (No login required)
          </span>
        </h2>
        <div className="space-y-3">
          {publicFeatures.map((feature) => (
            <div
              key={feature.name}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {feature.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {feature.desc}
                  </p>
                </div>
                <code className="shrink-0 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                  {feature.path}
                </code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Authenticated Features */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Authenticated Features
          <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
            (Login required)
          </span>
        </h2>
        <div className="space-y-3">
          {authFeatures.map((feature) => (
            <div
              key={feature.name}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
            >
              <h3 className="font-medium text-slate-900 dark:text-white">
                {feature.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Moderator/Admin Features */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Moderator & Admin Features
        </h2>
        <div className="space-y-3">
          {adminFeatures.map((feature) => (
            <div
              key={feature.name}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
            >
              <h3 className="font-medium text-slate-900 dark:text-white">
                {feature.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
        <Link 
          href="/docs/introduction" 
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Introduction
        </Link>
        <Link 
          href="/docs/guide/visitor" 
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Visitor Guide →
        </Link>
      </div>
    </div>
  );
}
