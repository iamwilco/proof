import Link from "next/link";

export const metadata = {
  title: "Visitor Guide - PROOF Documentation",
  description: "How to use PROOF without an account",
};

export default function VisitorGuidePage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">
          Documentation
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">
          User Guides
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Visitor</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Public Visitor Guide
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        For anyone exploring PROOF without an account
      </p>

      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h2>Getting Started</h2>
        <p>No account is needed to explore project data. Simply visit the site and start browsing.</p>

        <h2>Discovering Projects</h2>
        <h3>Step 1: Browse the Directory</h3>
        <ol>
          <li>Navigate to <strong>Projects</strong> in the main navigation</li>
          <li>You&apos;ll see a grid/list of all Catalyst proposals</li>
        </ol>

        <h3>Step 2: Use Filters</h3>
        <ul>
          <li><strong>Fund</strong>: F2, F3, ... F14, F15 (select specific round)</li>
          <li><strong>Status</strong>: Funded, In Progress, Completed, Not Approved</li>
          <li><strong>Category</strong>: DeFi, Identity, Governance, Developer Tools, etc.</li>
        </ul>

        <h3>Step 3: Search</h3>
        <p>Use the search bar to find projects by name or keyword. Search is case-insensitive.</p>

        <h2>Understanding Project Pages</h2>
        <p>When you click on a project, you&apos;ll see:</p>
        <ul>
          <li><strong>Header</strong>: Title, status badge, funding amount, fund name</li>
          <li><strong>Description</strong>: Problem statement, solution, and experience</li>
          <li><strong>Milestones</strong>: Timeline with SoM/PoA status for each</li>
          <li><strong>Team</strong>: All associated people with roles</li>
          <li><strong>Voting Results</strong>: Yes/no votes, approval rate</li>
          <li><strong>External Links</strong>: GitHub, website, social media</li>
          <li><strong>Community Reviews</strong>: What others have said (read-only)</li>
        </ul>

        <h2>Researching People</h2>
        <p>Click any team member name on a project page, or navigate to <strong>People</strong> and search.</p>
        <p>Person profiles show:</p>
        <ul>
          <li>All projects they&apos;ve been involved with</li>
          <li>Accountability score and badge</li>
          <li>Delivery history across funds</li>
        </ul>

        <h3>Understanding Accountability Badges</h3>
        <ul>
          <li>🟢 <strong>TRUSTED</strong> (80-100): Consistently delivers, high confidence</li>
          <li>🔵 <strong>RELIABLE</strong> (60-79): Generally delivers with minor issues</li>
          <li>🟡 <strong>UNPROVEN</strong> (40-59): Limited history or mixed results</li>
          <li>🔴 <strong>CONCERNING</strong> (0-39): Pattern of non-delivery or flags</li>
        </ul>

        <h2>Using the Network Graph</h2>
        <p>Navigate to <strong>Graph</strong> to see the interactive visualization.</p>
        <ul>
          <li><strong>Click nodes</strong> to see details</li>
          <li><strong>Drag nodes</strong> to reposition</li>
          <li><strong>Scroll</strong> to zoom in/out</li>
          <li><strong>Toggle filters</strong> to show/hide node types</li>
        </ul>

        <h2>Checking Rankings</h2>
        <p>Navigate to <strong>Rankings</strong> to see leaderboards for top projects and contributors.</p>
      </article>

      <div className="mt-12 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
        <Link href="/docs/features" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Features
        </Link>
        <Link href="/docs/guide/member" className="text-blue-600 dark:text-blue-400 hover:underline">
          Member Guide →
        </Link>
      </div>
    </div>
  );
}
