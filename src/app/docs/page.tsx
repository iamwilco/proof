import Link from "next/link";
import { Book, Users, Code, HelpCircle, FileText } from "lucide-react";

const sections = [
  {
    title: "Getting Started",
    icon: Book,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    items: [
      { name: "Introduction", href: "/docs/introduction", description: "Why PROOF exists, vision, and core concepts" },
      { name: "Features Overview", href: "/docs/features", description: "Complete feature list and descriptions" },
    ],
  },
  {
    title: "User Guides",
    icon: Users,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    items: [
      { name: "Public Visitor", href: "/docs/guide/visitor", description: "Browse projects without an account" },
      { name: "Registered Member", href: "/docs/guide/member", description: "Write reviews, submit concerns" },
      { name: "Project Proposer", href: "/docs/guide/proposer", description: "Claim projects, submit reports" },
      { name: "Community Reviewer", href: "/docs/guide/reviewer", description: "Enhanced review capabilities" },
      { name: "Moderator & Admin", href: "/docs/guide/moderator", description: "Platform moderation tools" },
    ],
  },
  {
    title: "Technical",
    icon: Code,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    items: [
      { name: "Architecture", href: "/docs/architecture", description: "Stack, schema, APIs, deployment" },
      { name: "API Reference", href: "/api/docs", description: "REST API documentation" },
    ],
  },
  {
    title: "Reference",
    icon: FileText,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    items: [
      { name: "Current Limitations", href: "/docs/limitations", description: "Known issues and constraints" },
      { name: "FAQ", href: "/docs/faq", description: "Frequently asked questions" },
      { name: "Glossary", href: "/docs/glossary", description: "Term definitions" },
    ],
  },
];

const quickLinks = [
  { name: "How is accountability calculated?", href: "/docs/faq#how-is-the-accountability-score-calculated" },
  { name: "What do the badges mean?", href: "/docs/faq#what-do-the-badges-mean" },
  { name: "How do I claim my project?", href: "/docs/guide/proposer#claiming-your-project" },
  { name: "How do I write a review?", href: "/docs/guide/member#writing-community-reviews" },
];

export const metadata = {
  title: "Documentation - PROOF",
  description: "Complete documentation for the PROOF transparency platform",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Documentation</h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            Everything you need to know about using PROOF for Catalyst transparency
          </p>
          
          {/* Quick Links */}
          <div className="mt-6 flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="rounded-full bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Purpose Banner */}
        <div className="mb-10 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">Why PROOF?</h2>
          <p className="text-blue-100">
            Cardano&apos;s Project Catalyst has distributed $100M+ across 2,000+ projects with no unified way 
            to track outcomes. PROOF makes treasury spending visible, proposers accountable, and helps 
            voters make informed decisions.
          </p>
          <Link 
            href="/docs/introduction" 
            className="mt-4 inline-block rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30 transition"
          >
            Read the full story →
          </Link>
        </div>

        {/* Sections Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {sections.map((section) => (
            <div 
              key={section.title}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`rounded-lg p-2 ${section.color}`}>
                  <section.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="group block rounded-lg p-3 -mx-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <span className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.name}
                      </span>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Scoring Overview */}
        <div className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Understanding Scores
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Accountability Score */}
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-3">Accountability Score</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Measures a proposer&apos;s delivery track record (0-100)
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-xs font-medium">
                    TRUSTED
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">80-100</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-xs font-medium">
                    RELIABLE
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">60-79</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-xs font-medium">
                    UNPROVEN
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">40-59</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-0.5 text-xs font-medium">
                    CONCERNING
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">0-39</span>
                </div>
              </div>
            </div>

            {/* ROI Score */}
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-3">ROI Score</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Measures outcome value relative to funding
              </p>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 text-sm font-mono text-slate-700 dark:text-slate-300">
                <div>ROI = Outcome / Funding</div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Outcome = GitHub (40%) + Deliverables (30%) + On-chain (30%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Need Help?
            </h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/docs/faq"
              className="rounded-lg border border-slate-200 dark:border-slate-600 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
            >
              <h3 className="font-medium text-slate-900 dark:text-white">FAQ</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Common questions answered
              </p>
            </Link>
            
            <Link
              href="/docs/limitations"
              className="rounded-lg border border-slate-200 dark:border-slate-600 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
            >
              <h3 className="font-medium text-slate-900 dark:text-white">Known Issues</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Current limitations and workarounds
              </p>
            </Link>
            
            <Link
              href="/contact"
              className="rounded-lg border border-slate-200 dark:border-slate-600 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
            >
              <h3 className="font-medium text-slate-900 dark:text-white">Contact</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Report bugs or request features
              </p>
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          PROOF is an independent community project for Cardano ecosystem transparency.
        </p>
      </div>
    </div>
  );
}
