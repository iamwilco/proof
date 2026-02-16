import Link from "next/link";

export const metadata = {
  title: "Glossary - PROOF Documentation",
  description: "Term definitions for PROOF",
};

const terms = [
  { term: "Accountability Score", def: "A numerical rating (0-100) assigned to individuals based on their history of delivering on Catalyst proposals." },
  { term: "ADA", def: "The native cryptocurrency of the Cardano blockchain. Used for Catalyst funding disbursements (Fund 10+)." },
  { term: "Alias", def: "An alternative name associated with a person, detected through identity resolution." },
  { term: "Badge", def: "Visual indicator of accountability level: TRUSTED, RELIABLE, UNPROVEN, or CONCERNING." },
  { term: "Blockfrost", def: "A third-party API service for querying the Cardano blockchain." },
  { term: "Catalyst Explorer", def: "Third-party platform (catalystexplorer.com) providing API access to Catalyst proposal data." },
  { term: "Category", def: "The thematic classification of a Catalyst proposal (e.g., DeFi, Governance, Developer Tools)." },
  { term: "Challenge", def: "In Catalyst, a specific problem statement or focus area that proposals can address within a fund." },
  { term: "CIP-30", def: "Cardano Improvement Proposal defining the standard for wallet-to-dApp communication." },
  { term: "Claim", def: "The process by which a proposer verifies ownership of a project on PROOF." },
  { term: "Concern", def: "A user-submitted issue about a specific project, requiring categorization and evidence." },
  { term: "Confidence Level", def: "A measure (0-1) of how reliable a calculated score is, based on available data." },
  { term: "Deliverable", def: "A concrete output or artifact produced by a project, often as part of a milestone." },
  { term: "DOGE View", def: "Informal name for PROOF's transparency interface, inspired by government spending transparency initiatives." },
  { term: "ETL", def: "Extract, Transform, Load - the process of collecting data from sources, processing it, and storing it." },
  { term: "Flag", def: "A warning indicator on a project or person. Can be automated (system-detected) or community (user-submitted)." },
  { term: "Fund", def: "A Catalyst funding round (e.g., Fund 10, Fund 14). Each fund has its own budget and timeline." },
  { term: "GitHub Score", def: "Component of ROI calculation measuring a project's GitHub activity." },
  { term: "Identity Resolution", def: "The process of determining that different name variations refer to the same person." },
  { term: "Magic Link", def: "Passwordless authentication method where users receive a login link via email." },
  { term: "Milestone", def: "A defined checkpoint in a project's roadmap with specific deliverables and timeline." },
  { term: "On-chain", def: "Activity recorded on the Cardano blockchain, as opposed to off-chain data." },
  { term: "Organization", def: "A company, DAO, or group entity associated with Catalyst proposals." },
  { term: "PoA", def: "Proof of Achievement - evidence submitted to verify milestone completion." },
  { term: "Proposer", def: "The primary submitter of a Catalyst proposal." },
  { term: "Reputation", def: "A user's accumulated credibility score based on contribution quality." },
  { term: "Review", def: "A detailed assessment of a project submitted by a community member." },
  { term: "ROI", def: "Return on Investment - score measuring outcome value relative to funding received." },
  { term: "SoM", def: "Statement of Milestone - a formal description of what will be delivered." },
  { term: "Source Provenance", def: "Metadata tracking where each piece of data came from (source_url, source_type, last_seen_at)." },
];

const acronyms = [
  { acronym: "ADA", meaning: "Cardano's native cryptocurrency" },
  { acronym: "API", meaning: "Application Programming Interface" },
  { acronym: "CIP", meaning: "Cardano Improvement Proposal" },
  { acronym: "ETL", meaning: "Extract, Transform, Load" },
  { acronym: "PoA", meaning: "Proof of Achievement" },
  { acronym: "PROOF", meaning: "Public Registry of Outcomes & On-chain Funding" },
  { acronym: "ROI", meaning: "Return on Investment" },
  { acronym: "SoM", meaning: "Statement of Milestone" },
];

export default function GlossaryPage() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <nav className="mb-6 text-sm">
        <Link href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-blue-600">
          Documentation
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Glossary</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Glossary
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Definitions of key terms used throughout the platform
      </p>

      {/* Terms */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Terms
        </h2>
        <div className="space-y-3">
          {terms.map((item) => (
            <div
              key={item.term}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
            >
              <h3 className="font-medium text-slate-900 dark:text-white">
                {item.term}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {item.def}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Acronyms */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Acronyms
        </h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Acronym</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {acronyms.map((item) => (
                <tr key={item.acronym} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3 font-mono text-slate-900 dark:text-white">{item.acronym}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-12 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
        <Link 
          href="/docs/faq" 
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← FAQ
        </Link>
        <Link 
          href="/docs" 
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to Docs
        </Link>
      </div>
    </div>
  );
}
