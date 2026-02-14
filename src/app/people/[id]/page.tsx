import Link from "next/link";
import { notFound } from "next/navigation";

import prisma from "../../../lib/prisma";
import AccountabilityBadge from "../../../components/AccountabilityBadge";
import ConnectionHoverCard from "../../../components/ConnectionHoverCard";
import AccountabilityDisputeForm from "../../../components/AccountabilityDisputeForm";
import ScoreBreakdown from "../../../components/ScoreBreakdown";

type PageProps = {
  params: Promise<{ id: string }>;
};

const getAuditScore = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as { score?: number };
  return typeof data.score === "number" ? data.score : null;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    funded: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    not_approved: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  };

  const colorClass = colors[status.toLowerCase()] ?? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
    {children}
  </section>
);

export default async function PersonDetailPage({ params }: PageProps) {
  const { id } = await params;

  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      accountabilityScore: {
        include: { audits: { orderBy: { createdAt: "desc" }, take: 2 } },
      },
      projectPeople: {
        include: {
          project: {
            include: {
              fund: true,
            },
          },
        },
      },
    },
  });

  if (!person) {
    notFound();
  }

  const projects = person.projectPeople.map((pp) => ({
    ...pp.project,
    role: pp.role,
  }));

  const totalFunding = projects.reduce(
    (sum, p) => sum + Number(p.fundingAmount),
    0
  );

  const audits = person.accountabilityScore?.audits ?? [];
  const currentScore = audits[0] ? getAuditScore(audits[0].payload) : null;
  const previousScore = audits[1] ? getAuditScore(audits[1].payload) : null;
  const trend =
    currentScore !== null && previousScore !== null
      ? currentScore > previousScore
        ? "improving"
        : currentScore < previousScore
          ? "declining"
          : "stable"
      : "stable";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/people"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to People
          </Link>
        </div>

        <header className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{person.name}</h1>
              {person.aliases.length > 0 && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Also known as: {person.aliases.join(", ")}
                </p>
              )}
            </div>
            {person.accountabilityScore && (
              <AccountabilityBadge
                badge={person.accountabilityScore.badge as "trusted" | "reliable" | "unproven" | "concerning"}
                score={person.accountabilityScore.overallScore}
                breakdown={person.accountabilityScore}
              />
            )}
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 dark:border-slate-700 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Projects
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {projects.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Total Funding (via projects)
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {formatCurrency(totalFunding)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Aliases
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {person.aliases.length}
              </p>
            </div>
          </div>
        </header>

        <Section title="Connections">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Preview related projects and organizations, then open a mini graph.
            </p>
            <ConnectionHoverCard entityType="person" entityId={person.id} href={`/people/${person.id}`}>
              <button
                type="button"
                className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Open connection explorer
              </button>
            </ConnectionHoverCard>
          </div>
        </Section>

        {person.accountabilityScore && (
          <Section title="Accountability Score">
            {person.accountabilityScore.status === "preview" && (
              <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-4 text-sm text-amber-800 dark:text-amber-300">
                <p className="font-semibold">Preview period active</p>
                {person.accountabilityScore.previewUntil && (
                  <p className="mt-1">
                    This score will publish on{" "}
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                      person.accountabilityScore.previewUntil
                    )}.
                  </p>
                )}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Overall</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  {person.accountabilityScore.overallScore}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Badge: {person.accountabilityScore.badge}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Status: {person.accountabilityScore.status}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Completion</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {person.accountabilityScore.completionScore}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500">On-time</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {person.accountabilityScore.deliveryScore}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Community</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {person.accountabilityScore.communityScore}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Efficiency</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {person.accountabilityScore.efficiencyScore}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Communication</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {person.accountabilityScore.communicationScore}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Calculated</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                      person.accountabilityScore.calculatedAt
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm">
                <p className="text-xs text-slate-400 dark:text-slate-500">Confidence</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {person.accountabilityScore.confidence}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {person.accountabilityScore.dataPoints} data points
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm">
                <p className="text-xs text-slate-400 dark:text-slate-500">Trend</p>
                <p
                  className={`mt-1 font-semibold ${
                    trend === "improving"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : trend === "declining"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {trend}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Based on recent recalculations</p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm">
                <p className="text-xs text-slate-400 dark:text-slate-500">Last updated</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                    person.accountabilityScore.calculatedAt
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <ScoreBreakdown
                completionScore={person.accountabilityScore.completionScore}
                deliveryScore={person.accountabilityScore.deliveryScore}
                communityScore={person.accountabilityScore.communityScore}
                efficiencyScore={person.accountabilityScore.efficiencyScore}
                communicationScore={person.accountabilityScore.communicationScore}
              />
            </div>

            {person.accountabilityScore.status === "preview" && (
              <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Dispute this score</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  If something looks off, submit a dispute for admin review.
                </p>
                <div className="mt-3">
                  <AccountabilityDisputeForm scoreId={person.accountabilityScore.id} />
                </div>
              </div>
            )}
          </Section>
        )}

        <div className="space-y-6">
          {person.aliases.length > 0 && (
            <Section title="Aliases">
              <ul className="space-y-2">
                {person.aliases.map((alias, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900 px-4 py-2"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">{alias}</span>
                    <span className="rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                      alias
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Aliases are detected through identity resolution. Confidence scoring coming soon.
              </p>
            </Section>
          )}

          {projects.length > 0 && (
            <Section title="Projects">
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-start justify-between rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 transition-colors hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {project.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{project.fund.name}</span>
                        <span>•</span>
                        <span>{formatCurrency(Number(project.fundingAmount))}</span>
                        {project.role && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400">{project.role}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <Section title="Source Provenance">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Source URL
                </dt>
                <dd className="mt-1 break-all text-sm text-slate-700 dark:text-slate-300">
                  <a
                    href={person.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {person.sourceUrl}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Source Type
                </dt>
                <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">{person.sourceType}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Last Seen
                </dt>
                <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                    person.lastSeenAt
                  )}
                </dd>
              </div>
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}
