import Link from "next/link";

export const metadata = {
  title: "Moderator Guide - PROOF Documentation",
  description: "Platform moderation tools and workflows",
};

export default function ModeratorGuidePage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">Documentation</Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Moderator Guide</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Moderator & Admin Guide</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">For platform moderators and administrators</p>

      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h2>Responsibilities</h2>
        <ul>
          <li><strong>Flag Review</strong>: Review and resolve automated and community flags</li>
          <li><strong>Report Moderation</strong>: Approve/reject monthly reports</li>
          <li><strong>Concern Resolution</strong>: Escalate or close concerns</li>
          <li><strong>Content Moderation</strong>: Remove policy-violating content</li>
        </ul>

        <h2>Flag Review Workflow</h2>
        <ol>
          <li>Navigate to <code>/flags</code> or <code>/admin/flags</code></li>
          <li>Filter by status: Pending, Confirmed, Dismissed</li>
          <li>Review flag description and evidence</li>
          <li>Take action: Confirm, Dismiss, or Request Info</li>
          <li>Document your decision</li>
        </ol>

        <h3>Automated Flag Types</h3>
        <ul>
          <li><strong>repeat_delays</strong>: Person has &gt;2 incomplete projects</li>
          <li><strong>similar_proposal</strong>: &gt;76% text similarity</li>
          <li><strong>abandoned</strong>: No activity in 6+ months</li>
          <li><strong>overdue_milestone</strong>: Past due date</li>
        </ul>

        <h2>Report Moderation</h2>
        <p>Review monthly reports at <code>/reports</code>:</p>
        <ul>
          <li><strong>Approve</strong>: Report meets criteria, publish</li>
          <li><strong>Request Changes</strong>: Needs improvement</li>
          <li><strong>Reject</strong>: Violates guidelines</li>
        </ul>

        <h2>Admin: User Management</h2>
        <p>Roles: MEMBER, PROPOSER, REVIEWER, MODERATOR, ADMIN</p>
        <p>Navigate to <code>/admin/users</code> to manage roles and handle bans.</p>

        <h2>Audit Trail</h2>
        <p>Every moderation action is logged with who, what, when, and why. Access at <code>/admin/audit</code>.</p>
      </article>

      <div className="mt-12 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
        <Link href="/docs/guide/reviewer" className="text-blue-600 dark:text-blue-400 hover:underline">← Reviewer Guide</Link>
        <Link href="/docs/architecture" className="text-blue-600 dark:text-blue-400 hover:underline">Architecture →</Link>
      </div>
    </div>
  );
}
