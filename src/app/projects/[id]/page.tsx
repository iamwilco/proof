import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import prisma from "../../../lib/prisma";
import { getSession } from "../../../lib/auth/session";
import RankingBadge from "../../../components/RankingBadge";
import VotingStats from "../../../components/VotingStats";
import ConnectionHoverCard from "../../../components/ConnectionHoverCard";
import FeedbackForm from "./FeedbackForm";
import FlagSection from "./FlagSection";
import LeaderResponsePanel from "./LeaderResponsePanel";
import ReportSection from "./ReportSection";
import ReviewSection from "./ReviewSection";

type PageProps = {
  params: Promise<{ id: string }>;
};

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { fund: true },
  });

  if (!project) {
    return { title: "Project not found" };
  }

  const baseUrl = getBaseUrl();
  const ogImage = `${baseUrl}/projects/${project.id}/opengraph-image`;
  const title = `${project.title} · ${project.fund.name}`;
  const description = project.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${baseUrl}/projects/${project.id}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | null) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(date);
};

const formatNumber = (value: number | null | undefined) =>
  typeof value === "number"
    ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)
    : "—";

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    funded: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    not_approved: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  };

  const colorClass = colors[status.toLowerCase()] ?? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${colorClass}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
};

const LinkIcon = ({ type }: { type: string }) => {
  const icons: Record<string, string> = {
    github_repo: "🔗",
    youtube_video: "▶️",
    website: "🌐",
    twitter: "🐦",
    discord: "💬",
  };
  return <span className="mr-2">{icons[type] ?? "🔗"}</span>;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
    {children}
  </section>
);

// Proposal Details Section - shows problem, solution, expected outcome
const ProposalDetails = ({ 
  problem, 
  solution, 
  experience 
}: { 
  problem?: string | null; 
  solution?: string | null; 
  experience?: string | null;
}) => {
  const hasContent = problem || solution || experience;
  if (!hasContent) return null;

  return (
    <section className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
      <h2 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">Proposal Details</h2>
      <div className="space-y-6">
        {problem && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-200">
              <span>🎯</span> Problem Statement
            </h3>
            <p className="mt-2 text-sm text-blue-900/80 dark:text-blue-100/80 whitespace-pre-wrap">
              {problem}
            </p>
          </div>
        )}
        {solution && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-200">
              <span>💡</span> Proposed Solution
            </h3>
            <p className="mt-2 text-sm text-blue-900/80 dark:text-blue-100/80 whitespace-pre-wrap">
              {solution}
            </p>
          </div>
        )}
        {experience && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-200">
              <span>👥</span> Team Experience & Qualifications
            </h3>
            <p className="mt-2 text-sm text-blue-900/80 dark:text-blue-100/80 whitespace-pre-wrap">
              {experience}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  const isAuthenticated = !!session;

  // Try to find by ID first, then by slug
  let project = await prisma.project.findUnique({
    where: { id },
    include: {
      fund: true,
      milestones: {
        include: {
          deliverables: true,
        },
        orderBy: { dueDate: "asc" },
      },
      deliverables: {
        where: { milestoneId: null },
      },
      projectPeople: {
        include: {
          person: true,
        },
      },
      projectOrgs: {
        include: {
          organization: true,
        },
      },
      concerns: {
        include: {
          responses: true,
        },
        orderBy: { createdAt: "desc" },
      },
      links: true,
      votingRecords: {
        orderBy: { capturedAt: "desc" },
        take: 1,
      },
      reports: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
      flags: {
        where: { status: { in: ["pending", "confirmed"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          flags: {
            where: { status: { in: ["pending", "confirmed"] } },
          },
        },
      },
    },
  });

  // If not found by ID, try by slug
  if (!project) {
    project = await prisma.project.findFirst({
      where: { slug: id },
      include: {
        fund: true,
        milestones: {
          include: {
            deliverables: true,
          },
          orderBy: { dueDate: "asc" },
        },
        deliverables: {
          where: { milestoneId: null },
        },
        projectPeople: {
          include: {
            person: true,
          },
        },
        projectOrgs: {
          include: {
            organization: true,
          },
        },
        concerns: {
          include: {
            responses: true,
          },
          orderBy: { createdAt: "desc" },
        },
        links: true,
        votingRecords: {
          orderBy: { capturedAt: "desc" },
          take: 1,
        },
        reports: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
        flags: {
          where: { status: { in: ["pending", "confirmed"] } },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            flags: {
              where: { status: { in: ["pending", "confirmed"] } },
            },
          },
        },
      },
    });
  }

  if (!project) {
    notFound();
  }

  // Redirect UUID URLs to clean slug URLs for better SEO and readability
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUUID && project.slug) {
    redirect(`/projects/${project.slug}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/projects"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Projects
          </Link>
        </div>

        {project._count.flags > 0 && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                  This project has {project._count.flags} active flag{project._count.flags > 1 ? "s" : ""}
                </h3>
                <div className="mt-2 space-y-1">
                  {project.flags.map((flag) => (
                    <div key={flag.id} className="text-sm text-red-700 dark:text-red-400">
                      <span className="font-medium">{flag.category.replace(/_/g, " ")}:</span>{" "}
                      {flag.title}
                    </div>
                  ))}
                </div>
                <Link
                  href={`/flags?projectId=${project.id}`}
                  className="mt-3 inline-block text-sm font-medium text-red-700 dark:text-red-400 hover:underline"
                >
                  View all flags →
                </Link>
              </div>
            </div>
          </div>
        )}

        <header className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.title}</h1>
              {project.challenge && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Challenge: {project.challenge}
                </p>
              )}
              <p className="mt-2 text-base text-slate-600 dark:text-slate-300">{project.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {project.votingRecords[0]?.fundRank && (
                <RankingBadge rank={project.votingRecords[0].fundRank} label="Fund" />
              )}
              <StatusBadge status={project.status} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 dark:border-slate-700 pt-6 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Funding
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {formatCurrency(Number(project.fundingAmount))}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Fund
              </p>
              <Link href={`/funds/${project.fund.number}`} className="mt-1 block text-base font-medium text-blue-600 dark:text-blue-400 hover:underline">
                {project.fund.name}
              </Link>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Category
              </p>
              <p className="mt-1 text-base text-slate-700 dark:text-slate-300">{project.category}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Status
              </p>
              <p className="mt-1 text-base text-slate-700 dark:text-slate-300">
                {project.status.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </header>

        {/* Proposal Details - Problem, Solution, Expected Outcome */}
        <ProposalDetails
          problem={project.problem}
          solution={project.solution}
          experience={project.experience}
        />

        {(project.githubUrl || project.githubActivityScore !== null) && (
          <Section title="GitHub Activity">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Repository metrics snapshot.</p>
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {project.githubOwner && project.githubRepo
                      ? `${project.githubOwner}/${project.githubRepo}`
                      : "View GitHub repo"}
                  </a>
                )}
              </div>
              <div className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300">
                Activity score: {project.githubActivityScore ?? "—"}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">Stars</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatNumber(project.githubStars)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">Forks</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatNumber(project.githubForks)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">Watchers</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatNumber(project.githubWatchers)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">Contributors</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatNumber(project.githubContributors)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">Issues closed</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {project.githubIssueCloseRate !== null &&
                  project.githubIssueCloseRate !== undefined
                    ? `${Math.round(project.githubIssueCloseRate * 100)}%`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">PR merge rate</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {project.githubPrMergeRate !== null && project.githubPrMergeRate !== undefined
                    ? `${Math.round(project.githubPrMergeRate * 100)}%`
                    : "—"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm">
                <p className="text-xs text-slate-400 dark:text-slate-500">Last push</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {formatDate(project.githubLastPush)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm">
                <p className="text-xs text-slate-400 dark:text-slate-500">Last commit</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {formatDate(project.githubLastCommit)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm">
                <p className="text-xs text-slate-400 dark:text-slate-500">Last synced</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {formatDate(project.githubLastSync)}
                </p>
              </div>
            </div>
          </Section>
        )}

        {(project.onchainAddress || project.onchainTxCount !== null) && (
          <Section title="On-Chain Activity">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Cardano blockchain activity for this project.</p>
                {project.onchainAddress && (
                  <a
                    href={`https://cardanoscan.io/address/${project.onchainAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {project.onchainAddress.slice(0, 12)}...{project.onchainAddress.slice(-8)}
                  </a>
                )}
              </div>
              {project.onchainPolicyId && (
                <div className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300">
                  Policy: {project.onchainPolicyId.slice(0, 8)}...
                </div>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">Transactions</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatNumber(project.onchainTxCount)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">Unique Addresses</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatNumber(project.onchainUniqueAddresses)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">Total Received</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {project.onchainTotalReceived
                    ? `₳${formatNumber(Number(project.onchainTotalReceived))}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">Total Sent</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {project.onchainTotalSent
                    ? `₳${formatNumber(Number(project.onchainTotalSent))}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">First Transaction</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatDate(project.onchainFirstTx)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">Last Transaction</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatDate(project.onchainLastTx)}
                </p>
              </div>
            </div>
            {project.onchainLastSync && (
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                Last synced: {formatDate(project.onchainLastSync)}
              </p>
            )}
          </Section>
        )}

        <div className="space-y-6">
          <Section title="Connections">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Hover to preview the strongest relationships around this proposal.
              </p>
              <ConnectionHoverCard entityType="project" entityId={project.id} href={`/projects/${project.id}`}>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Open connection explorer
                </button>
              </ConnectionHoverCard>
            </div>
          </Section>
          {project.votingRecords.length > 0 && (
            <Section title="Voting Results">
              <VotingStats
                yesVotes={project.votingRecords[0].yesVotes}
                noVotes={project.votingRecords[0].noVotes}
                abstainVotes={project.votingRecords[0].abstainVotes}
                uniqueWallets={project.votingRecords[0].uniqueWallets}
                approvalRate={project.votingRecords[0].approvalRate}
                fundRank={project.votingRecords[0].fundRank}
                categoryRank={project.votingRecords[0].categoryRank}
              />
            </Section>
          )}

          {isAuthenticated ? (
            <Section title="Feedback">
              <FeedbackForm projectId={project.id} />
            </Section>
          ) : (
            <Section title="Feedback">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Sign in
                  </Link>{" "}
                  to rate this project or submit feedback.
                </p>
              </div>
            </Section>
          )}
          <ReviewSection projectId={project.id} isAuthenticated={isAuthenticated} />
          {isAuthenticated && (
            <Section title="Leader responses">
              <LeaderResponsePanel
                projectId={project.id}
                concerns={project.concerns.map((concern) => ({
                  id: concern.id,
                  description: concern.description,
                  category: concern.category,
                  status: concern.status,
                }))}
              />
            </Section>
          )}
          {project.concerns.length > 0 && (
            <Section title="Concerns & Responses">
              <div className="space-y-4">
                {project.concerns.map((concern) => (
                  <div
                    key={concern.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {concern.category}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{concern.status}</p>
                      </div>
                      {concern.evidenceUrl && (
                        <a
                          href={concern.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Evidence
                        </a>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                      {concern.description}
                    </p>
                    {concern.responses.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                        {concern.responses.map((response) => (
                          <div
                            key={response.id}
                            className="rounded-md bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
                          >
                            {response.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {project.projectPeople.length > 0 && (
            <Section title="Team Members">
              <ul className="space-y-3">
                {project.projectPeople.map((pp) => (
                  <li key={pp.id} className="flex items-center justify-between">
                    <Link
                      href={`/people/${pp.person.id}`}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {pp.person.name}
                    </Link>
                    {pp.role && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">{pp.role}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {project.projectOrgs.length > 0 && (
            <Section title="Organizations">
              <ul className="space-y-2">
                {project.projectOrgs.map((po) => (
                  <li key={po.id} className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 dark:text-white">
                      {po.organization.name}
                    </span>
                    {po.role && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">{po.role}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <ReportSection
            projectId={project.id}
            initialReports={project.reports.map((report) => ({
              ...report,
              createdAt: report.createdAt.toISOString(),
            }))}
            isAuthenticated={isAuthenticated}
          />

          {project.milestones.length > 0 && (
            <Section title="Milestones">
              <div className="space-y-4">
                {project.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {milestone.title}
                        </h3>
                        {milestone.dueDate && (
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Due: {formatDate(milestone.dueDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <StatusBadge status={milestone.status} />
                        {milestone.somStatus && (
                          <span className="rounded-full bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                            SoM: {milestone.somStatus.replace(/_/g, " ")}
                          </span>
                        )}
                        {milestone.poaStatus && (
                          <span className="rounded-full bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                            PoA: {milestone.poaStatus.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {milestone.evidenceUrls.length > 0 && (
                      <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Evidence
                        </p>
                        <ul className="space-y-1 text-sm">
                          {milestone.evidenceUrls.map((url) => (
                            <li key={url} className="truncate">
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {milestone.deliverables.length > 0 && (
                      <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Deliverables
                        </p>
                        <ul className="space-y-1">
                          {milestone.deliverables.map((d) => (
                            <li
                              key={d.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-slate-700 dark:text-slate-300">{d.title}</span>
                              <span
                                className={`text-xs ${
                                  d.status === "completed"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}
                              >
                                {d.status.replace(/_/g, " ")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {project.deliverables.length > 0 && (
            <Section title="Deliverables (Unlinked)">
              <ul className="space-y-2">
                {project.deliverables.map((d) => (
                  <li key={d.id} className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300">{d.title}</span>
                    <span
                      className={`text-sm ${
                        d.status === "completed"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {d.status.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="External Links">
            <ul className="space-y-3">
              {/* Official Project Catalyst link — milestones.projectcatalyst.io */}
              {project.catalystUrl && (
                <li>
                  <a
                    href={project.catalystUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span className="mr-2">🏛️</span>
                    <span className="text-sm">View on Project Catalyst</span>
                  </a>
                  <span className="ml-6 text-xs text-slate-400 dark:text-slate-500">
                    Official Milestone Module · projectcatalyst.io
                  </span>
                </li>
              )}
              {/* IdeaScale link */}
              {project.ideascaleUrl && (
                <li>
                  <a
                    href={project.ideascaleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span className="mr-2">�</span>
                    <span className="text-sm">View on IdeaScale</span>
                  </a>
                  <span className="ml-6 text-xs text-slate-400 dark:text-slate-500">
                    Original Proposal
                  </span>
                </li>
              )}
              {/* Website */}
              {project.website && (
                <li>
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span className="mr-2">🌐</span>
                    <span className="text-sm">{project.website}</span>
                  </a>
                  <span className="ml-6 text-xs text-slate-400 dark:text-slate-500">
                    Project Website
                  </span>
                </li>
              )}
              {/* Additional project links */}
              {project.links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <LinkIcon type={link.type} />
                    <span className="text-sm">{link.url}</span>
                  </a>
                  <span className="ml-6 text-xs text-slate-400 dark:text-slate-500">
                    {link.type.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
              {/* Fallback message if no links */}
              {!project.catalystUrl && !project.ideascaleUrl && !project.website && project.links.length === 0 && (
                <li className="text-sm text-slate-500 dark:text-slate-400">
                  No external links available for this project.
                </li>
              )}
            </ul>
          </Section>

          {isAuthenticated ? (
            <FlagSection projectId={project.id} projectTitle={project.title} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Community Oversight</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Help maintain transparency by reporting concerns about this project.
              </p>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Sign in
                  </Link>{" "}
                  to report concerns about this project.
                </p>
              </div>
            </div>
          )}

          <Section title="Source Provenance">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Source URL
                </dt>
                <dd className="mt-1 break-all text-sm text-slate-700 dark:text-slate-300">
                  <a
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {project.sourceUrl}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Source Type
                </dt>
                <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">{project.sourceType}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Last Seen
                </dt>
                <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {formatDate(project.lastSeenAt)}
                </dd>
              </div>
            </dl>
          </Section>

          <footer className="text-center text-xs text-slate-400 dark:text-slate-500">
            <p>
              Created: {formatDate(project.createdAt)} · Updated:{" "}
              {formatDate(project.updatedAt)}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
