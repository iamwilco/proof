import Link from "next/link";

export const metadata = {
  title: "Proposer Guide - PROOF Documentation",
  description: "How to manage your projects as a funded proposer",
};

export default function ProposerGuidePage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">Documentation</Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Proposer Guide</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Project Proposer Guide</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">For funded Catalyst proposers</p>

      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h2 id="claiming-your-project">Claiming Your Project</h2>
        <ol>
          <li>Find your project in the directory</li>
          <li>Click <strong>Claim This Project</strong></li>
          <li>Verify ownership via wallet signature or email</li>
          <li>Wait for moderator approval (24-48 hours)</li>
        </ol>

        <h2>Submitting Monthly Reports</h2>
        <ol>
          <li>Navigate to your claimed project page</li>
          <li>Scroll to <strong>Monthly Reports</strong> section</li>
          <li>Click <strong>Submit Report</strong></li>
          <li>Provide summary, blockers, next steps, and evidence URLs</li>
          <li>Reports are reviewed by moderators before publication</li>
        </ol>

        <h2>Responding to Concerns</h2>
        <p>When someone submits a concern about your project:</p>
        <ol>
          <li>You&apos;ll receive a notification</li>
          <li>Navigate to the concern</li>
          <li>Click <strong>Respond</strong></li>
          <li>Address the specific issue with evidence</li>
        </ol>
        <p>Good responses acknowledge issues and explain actions taken.</p>

        <h2>Building Your Accountability Score</h2>
        <ul>
          <li><strong>Completion (30%)</strong>: Complete projects you start</li>
          <li><strong>Delivery (25%)</strong>: Hit milestone deadlines</li>
          <li><strong>Community (20%)</strong>: Get positive reviews</li>
          <li><strong>Efficiency (15%)</strong>: Deliver value relative to funding</li>
          <li><strong>Communication (10%)</strong>: Submit reports, respond to concerns</li>
        </ul>

        <h2>Tips for Success</h2>
        <ul>
          <li>Submit monthly reports even when progress is slow</li>
          <li>Address concerns promptly</li>
          <li>Keep all links and documentation current</li>
          <li>Be transparent about delays</li>
        </ul>
      </article>

      <div className="mt-12 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
        <Link href="/docs/guide/member" className="text-blue-600 dark:text-blue-400 hover:underline">← Member Guide</Link>
        <Link href="/docs/guide/reviewer" className="text-blue-600 dark:text-blue-400 hover:underline">Reviewer Guide →</Link>
      </div>
    </div>
  );
}
