import Link from "next/link";

export const metadata = {
  title: "Member Guide - PROOF Documentation",
  description: "How to contribute as a registered member",
};

export default function MemberGuidePage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">Documentation</Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Member Guide</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Registered Member Guide</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">For community members with an account</p>

      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h2>Creating Your Account</h2>
        <ol>
          <li>Click <strong>Login</strong> in the navigation bar</li>
          <li>Choose: Magic Link (email), Google, or Cardano Wallet</li>
          <li>Follow the prompts</li>
        </ol>

        <h2 id="writing-community-reviews">Writing Community Reviews</h2>
        <ol>
          <li>Navigate to any project detail page</li>
          <li>Scroll to <strong>Community Reviews</strong> section</li>
          <li>Click <strong>Write Review</strong></li>
          <li>Provide rating (1-5 stars), title, and detailed content</li>
          <li>Submit for publication</li>
        </ol>
        <h3>Best Practices</h3>
        <ul>
          <li>✅ Be specific and cite evidence</li>
          <li>✅ Separate facts from opinions</li>
          <li>✅ Be constructive, not inflammatory</li>
          <li>❌ Don&apos;t make unsubstantiated claims</li>
        </ul>

        <h2>Submitting Concerns</h2>
        <p>Concerns are structured ways to flag specific issues with a project.</p>
        <h3>Categories</h3>
        <ul>
          <li><strong>Delayed Delivery</strong>: Missed milestones</li>
          <li><strong>Communication Issues</strong>: Unresponsive team</li>
          <li><strong>Quality Issues</strong>: Deliverables below expectations</li>
          <li><strong>Misrepresentation</strong>: Inaccurate claims</li>
        </ul>

        <h2>Building Reputation</h2>
        <p>Your reputation score increases through:</p>
        <ul>
          <li>Reviews marked helpful: +5 points</li>
          <li>Concerns confirmed: +10 points</li>
          <li>Reviews marked unhelpful: -2 points</li>
        </ul>
        <p>Tiers: Bronze (0-99), Silver (100-499), Gold (500+)</p>

        <h2>Managing Bookmarks</h2>
        <p>Click the bookmark icon on any project to save it. Create custom lists via <strong>/bookmarks</strong>.</p>
      </article>

      <div className="mt-12 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
        <Link href="/docs/guide/visitor" className="text-blue-600 dark:text-blue-400 hover:underline">← Visitor Guide</Link>
        <Link href="/docs/guide/proposer" className="text-blue-600 dark:text-blue-400 hover:underline">Proposer Guide →</Link>
      </div>
    </div>
  );
}
