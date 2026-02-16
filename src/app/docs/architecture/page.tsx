import Link from "next/link";

export const metadata = {
  title: "Architecture - PROOF Documentation",
  description: "Technical architecture and stack details",
};

export default function ArchitecturePage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">Documentation</Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Architecture</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Technical Architecture</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">Stack, schema, and APIs</p>

      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h2>Technology Stack</h2>
        <h3>Frontend</h3>
        <ul>
          <li><strong>Next.js 16</strong> with App Router</li>
          <li><strong>React 19</strong> with TypeScript</li>
          <li><strong>Tailwind CSS 4</strong> for styling</li>
          <li><strong>TanStack Query</strong> for data fetching</li>
          <li><strong>Cytoscape.js</strong> for network visualization</li>
        </ul>

        <h3>Backend</h3>
        <ul>
          <li><strong>Next.js API Routes</strong> for endpoints</li>
          <li><strong>Prisma 6</strong> ORM</li>
          <li><strong>PostgreSQL</strong> via Supabase</li>
        </ul>

        <h3>ETL Pipeline</h3>
        <ul>
          <li><strong>TypeScript</strong> ingestion scripts (tsx)</li>
          <li><strong>Python</strong> scrapers and data processing</li>
        </ul>

        <h2>Database Schema</h2>
        <p>40+ Prisma models including:</p>
        <ul>
          <li><strong>Fund</strong>: Catalyst funding rounds</li>
          <li><strong>Project</strong>: Proposals with metrics</li>
          <li><strong>Milestone</strong>: Checkpoints with SoM/PoA</li>
          <li><strong>Person</strong>: Proposers and team members</li>
          <li><strong>Organization</strong>: Companies and teams</li>
          <li><strong>Review, Flag, Concern</strong>: Community input</li>
          <li><strong>AccountabilityScore, ProjectROI</strong>: Computed scores</li>
        </ul>

        <h2>Authentication</h2>
        <ul>
          <li><strong>Magic Link</strong>: Email-based, 15-minute tokens</li>
          <li><strong>Google OAuth</strong>: Standard OAuth flow</li>
          <li><strong>Wallet Auth</strong>: CIP-30 signature verification</li>
        </ul>

        <h2>Data Flow</h2>
        <pre><code>{`External APIs → ETL Pipeline → PostgreSQL → API Routes → React Frontend`}</code></pre>

        <h3>Data Sources</h3>
        <ul>
          <li><strong>Catalyst Explorer</strong>: catalystexplorer.com/api/v1</li>
          <li><strong>GitHub API</strong>: Repository metrics</li>
          <li><strong>Blockfrost</strong>: On-chain transactions</li>
          <li><strong>Milestones Portal</strong>: Manual JSON export</li>
        </ul>

        <h2>ROI Calculation</h2>
        <pre><code>{`ROI = Outcome Score / Normalized Funding

Outcome = GitHub (40%) + Deliverables (30%) + On-chain (30%)`}</code></pre>

        <h2>Running Locally</h2>
        <pre><code>{`npm install
npx prisma generate
npx prisma db push
npm run dev`}</code></pre>

        <h2>Environment Variables</h2>
        <ul>
          <li><code>DATABASE_URL</code>: PostgreSQL connection</li>
          <li><code>NEXT_PUBLIC_SUPABASE_URL</code>: Supabase URL</li>
          <li><code>GITHUB_TOKEN</code>: GitHub API access</li>
          <li><code>BLOCKFROST_API_KEY</code>: Cardano on-chain data</li>
        </ul>
      </article>

      <div className="mt-12 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
        <Link href="/docs/guide/moderator" className="text-blue-600 dark:text-blue-400 hover:underline">← Moderator Guide</Link>
        <Link href="/docs/limitations" className="text-blue-600 dark:text-blue-400 hover:underline">Limitations →</Link>
      </div>
    </div>
  );
}
