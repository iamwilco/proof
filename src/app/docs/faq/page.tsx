import Link from "next/link";

export const metadata = {
  title: "FAQ - PROOF Documentation",
  description: "Frequently asked questions about PROOF",
};

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "What is PROOF?",
        a: "PROOF (Public Registry of Outcomes & On-chain Funding) is a transparency platform for Cardano's Project Catalyst treasury. It tracks funded proposals, team accountability, milestone completion, and community feedback.",
      },
      {
        q: "Is PROOF official?",
        a: "No. PROOF is an independent community tool, not affiliated with IOG, the Cardano Foundation, or Project Catalyst officially.",
      },
      {
        q: "Is PROOF free to use?",
        a: "Yes. All public features are free without an account. Creating an account to contribute is also free.",
      },
    ],
  },
  {
    category: "Data",
    questions: [
      {
        q: "Where does the data come from?",
        a: "Data is sourced from Catalyst Explorer API (proposals), GitHub API (code metrics), Blockfrost API (on-chain data), and community submissions (reviews, concerns).",
      },
      {
        q: "How current is the data?",
        a: "Proposals sync daily, GitHub metrics update on-demand, milestones update periodically, and community content is real-time.",
      },
      {
        q: "Is the data accurate?",
        a: "We strive for accuracy, but source data may contain errors. Identity resolution has ~86% confidence. Every data point shows its source for verification.",
      },
    ],
  },
  {
    category: "Scoring",
    questions: [
      {
        id: "how-is-the-accountability-score-calculated",
        q: "How is the accountability score calculated?",
        a: "The score (0-100) combines: Completion (30%), Delivery timing (25%), Community ratings (20%), Efficiency (15%), and Communication (10%).",
      },
      {
        id: "what-do-the-badges-mean",
        q: "What do the badges mean?",
        a: "TRUSTED (80-100): Consistently delivers. RELIABLE (60-79): Generally delivers. UNPROVEN (40-59): Limited history. CONCERNING (0-39): Pattern of issues.",
      },
      {
        q: "Why is someone marked UNPROVEN?",
        a: "UNPROVEN means limited data, not poor performance. New proposers start here until they build history.",
      },
      {
        q: "Can scores be gamed?",
        a: "Scores use multiple data sources and objective metrics. Gaming is difficult but not impossible. Report suspicious patterns.",
      },
      {
        q: "My score seems wrong. What can I do?",
        a: "Check the breakdown on your profile. If data is incorrect, submit a dispute with evidence. Moderators will review.",
      },
    ],
  },
  {
    category: "Reviews & Concerns",
    questions: [
      {
        q: "How do I write a good review?",
        a: "Be specific with evidence, separate facts from opinions, consider scope and funding level, and be constructive.",
      },
      {
        q: "Can project teams remove reviews?",
        a: "No. Teams can respond to reviews or report guideline violations, but cannot remove valid reviews.",
      },
      {
        q: "What's the difference between a review and a concern?",
        a: "Reviews are general assessments with ratings. Concerns are specific, fact-based issues with evidence requirements.",
      },
    ],
  },
  {
    category: "Account",
    questions: [
      {
        q: "Do I need an account?",
        a: "No account needed to browse. Create an account to write reviews, submit concerns, and bookmark projects.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to Profile Settings → Delete Account. Your content will remain but be anonymized.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">
          Documentation
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">FAQ</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Common questions about using PROOF
      </p>

      <div className="space-y-10">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.questions.map((item, idx) => (
                <div
                  key={idx}
                  id={(item as { id?: string }).id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5"
                >
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                    {item.q}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-2">
          Still have questions?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
          Can&apos;t find what you&apos;re looking for? Get in touch.
        </p>
        <Link
          href="/contact"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
