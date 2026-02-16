import Link from "next/link";

export const metadata = {
  title: "Introduction - PROOF Documentation",
  description: "Why PROOF exists, vision, and core concepts",
};

export default function IntroductionPage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">
          Documentation
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Introduction</span>
      </nav>

      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h1>Why PROOF Exists</h1>

        <h2>The Problem</h2>
        <p>
          Cardano&apos;s Project Catalyst is one of the world&apos;s largest decentralized innovation funds, 
          distributing millions of dollars to community-proposed projects. However, a critical 
          transparency gap exists:
        </p>
        <ul>
          <li><strong>$100M+ distributed</strong> across 14+ funding rounds</li>
          <li><strong>2,000+ funded projects</strong> with varying completion rates</li>
          <li><strong>No unified view</strong> of who delivered what, when, and how well</li>
          <li><strong>Repeat proposers</strong> can secure funding without accountability for past performance</li>
          <li><strong>Community has no tools</strong> to track outcomes or identify patterns</li>
        </ul>
        <p>
          The result? Treasury funds flow to projects with little visibility into actual outcomes. 
          Successful builders get no recognition. Underperformers face no consequences. 
          The community lacks the data to make informed voting decisions.
        </p>

        <h2>The &quot;DOGE View&quot; Concept</h2>
        <p>
          Inspired by transparency initiatives that make government spending visible and accountable, 
          PROOF creates a &quot;DOGE View&quot; for Cardano treasury spending:
        </p>
        <ul>
          <li><strong>Every dollar tracked</strong> from proposal to milestone to on-chain activity</li>
          <li><strong>Every proposer scored</strong> based on delivery history</li>
          <li><strong>Every project connected</strong> to people, organizations, and outcomes</li>
          <li><strong>Community oversight</strong> through reviews, flags, and concerns</li>
        </ul>

        <h2>Why We Built This</h2>
        <ol>
          <li><strong>Accountability matters</strong>: Public funds deserve public scrutiny</li>
          <li><strong>Builders deserve recognition</strong>: Those who deliver should be visible</li>
          <li><strong>Voters need data</strong>: Informed decisions require accessible information</li>
          <li><strong>Patterns should surface</strong>: Repeat delays and concerning behavior should be flagged</li>
          <li><strong>The ecosystem needs trust</strong>: Transparency builds confidence in treasury governance</li>
        </ol>

        <hr />

        <h1>Platform Vision & Goals</h1>

        <blockquote>
          <p>Make Cardano treasury funding outcomes legible, comparable, and socially accountable.</p>
        </blockquote>

        <h2>Primary Goals</h2>
        <table>
          <thead>
            <tr>
              <th>Goal</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Transparency</strong></td>
              <td>Surface all available data about funded projects and their outcomes</td>
            </tr>
            <tr>
              <td><strong>Accountability</strong></td>
              <td>Track proposer history and create incentives for delivery</td>
            </tr>
            <tr>
              <td><strong>Discoverability</strong></td>
              <td>Help voters find projects, compare proposals, identify builders</td>
            </tr>
            <tr>
              <td><strong>Community Intelligence</strong></td>
              <td>Enable reviews, flags, concerns, and shared knowledge</td>
            </tr>
          </tbody>
        </table>

        <h2>Core Invariants (Never Broken)</h2>
        <ol>
          <li><strong>Fact-first</strong>: Every claim must be source-linked or marked as community opinion</li>
          <li><strong>Neutral language</strong>: Use &quot;low observed activity&quot; not accusations</li>
          <li><strong>Source provenance</strong>: Every field tracks <code>source_url</code>, <code>source_type</code>, <code>last_seen_at</code></li>
          <li><strong>No doxxing</strong>: Only public data; no private information</li>
          <li><strong>Confidence transparency</strong>: All scores display confidence levels and methodology</li>
          <li><strong>Immutable audit trail</strong>: All moderation actions logged; edits tracked, never deleted</li>
        </ol>

        <hr />

        <h1>Core Concepts</h1>

        <h2>The Data Model</h2>
        <p>PROOF connects five core entities into a knowledge graph:</p>
        <ul>
          <li><strong>Funds</strong> → <strong>Projects</strong> → <strong>Milestones</strong> → <strong>Deliverables</strong></li>
          <li><strong>Projects</strong> ↔ <strong>People</strong> (via team membership)</li>
          <li><strong>People</strong> ↔ <strong>Organizations</strong></li>
        </ul>

        <h2>Accountability Scoring (0-100)</h2>
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Weight</th>
              <th>Measures</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Completion</strong></td>
              <td>30%</td>
              <td>% of projects completed vs started</td>
            </tr>
            <tr>
              <td><strong>Delivery</strong></td>
              <td>25%</td>
              <td>On-time milestone delivery rate</td>
            </tr>
            <tr>
              <td><strong>Community</strong></td>
              <td>20%</td>
              <td>Ratings and community feedback</td>
            </tr>
            <tr>
              <td><strong>Efficiency</strong></td>
              <td>15%</td>
              <td>Actual spend vs. budget, ROI</td>
            </tr>
            <tr>
              <td><strong>Communication</strong></td>
              <td>10%</td>
              <td>Responsiveness, monthly reports</td>
            </tr>
          </tbody>
        </table>

        <h3>Badge Levels</h3>
        <ul>
          <li>🟢 <strong>TRUSTED</strong> (80-100): Consistently delivers</li>
          <li>🔵 <strong>RELIABLE</strong> (60-79): Generally delivers with minor issues</li>
          <li>🟡 <strong>UNPROVEN</strong> (40-59): Limited history or mixed results</li>
          <li>🔴 <strong>CONCERNING</strong> (0-39): Pattern of non-delivery or flags</li>
        </ul>

        <h2>ROI Scoring</h2>
        <pre><code>ROI = Outcome Score / Normalized Funding ($10k baseline)

Outcome Score = (GitHub × 0.4) + (Deliverables × 0.3) + (On-chain × 0.3)</code></pre>

        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Metrics</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>GitHub</strong></td>
              <td>Stars, forks, contributors, commit activity, PR merge rate</td>
            </tr>
            <tr>
              <td><strong>Deliverables</strong></td>
              <td>Milestone completion rate, on-time delivery %</td>
            </tr>
            <tr>
              <td><strong>On-chain</strong></td>
              <td>Transaction count, unique addresses, ADA volume</td>
            </tr>
          </tbody>
        </table>
      </article>

      <div className="mt-12 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
        <div></div>
        <Link 
          href="/docs/features" 
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Features Overview →
        </Link>
      </div>
    </div>
  );
}
