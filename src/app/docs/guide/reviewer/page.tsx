import Link from "next/link";

export const metadata = {
  title: "Reviewer Guide - PROOF Documentation",
  description: "Enhanced review capabilities for trusted reviewers",
};

export default function ReviewerGuidePage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">Documentation</Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Reviewer Guide</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Community Reviewer Guide</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">For trusted community members with enhanced review capabilities</p>

      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h2>Becoming a Reviewer</h2>
        <p>Requirements:</p>
        <ul>
          <li>Account age: 30+ days</li>
          <li>Reputation: Silver tier (100+ points)</li>
          <li>Reviews written: 10+</li>
          <li>Helpful rate: 70%+</li>
        </ul>

        <h2>Review Framework</h2>
        <h3>Impact Alignment (1-5)</h3>
        <p>Does this solve a real problem for Cardano users?</p>
        <ul>
          <li>5: Directly advances Cardano&apos;s core mission</li>
          <li>3: Some relevance, indirect benefits</li>
          <li>1: No clear benefit to ecosystem</li>
        </ul>

        <h3>Feasibility (1-5)</h3>
        <p>Is the plan realistic?</p>
        <ul>
          <li>5: Highly achievable with stated resources</li>
          <li>3: Possible but some risks</li>
          <li>1: Unlikely to be achievable</li>
        </ul>

        <h3>Auditability (1-5)</h3>
        <p>Can progress be verified?</p>
        <ul>
          <li>5: All progress easily verifiable</li>
          <li>3: Some deliverables verifiable</li>
          <li>1: No clear way to verify delivery</li>
        </ul>

        <h2>Ethics</h2>
        <p>Do NOT review projects where you have:</p>
        <ul>
          <li>Financial interest</li>
          <li>Personal relationship with team</li>
          <li>Competing project</li>
        </ul>
      </article>

      <div className="mt-12 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
        <Link href="/docs/guide/proposer" className="text-blue-600 dark:text-blue-400 hover:underline">← Proposer Guide</Link>
        <Link href="/docs/guide/moderator" className="text-blue-600 dark:text-blue-400 hover:underline">Moderator Guide →</Link>
      </div>
    </div>
  );
}
