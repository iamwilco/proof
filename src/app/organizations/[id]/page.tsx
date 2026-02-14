import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge, getAccountabilityLabel, getAccountabilityVariant } from "@/components/ui";
import prisma from "../../../lib/prisma";
import ConnectionHoverCard from "../../../components/ConnectionHoverCard";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ id: string }>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
  }).format(value);

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  funded: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
    {children}
  </section>
);

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params;

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      accountabilityScore: true,
      members: {
        include: {
          person: {
            select: {
              id: true,
              name: true,
              heroImgUrl: true,
              proposalsCount: true,
              fundedProposalsCount: true,
            },
          },
        },
      },
      projectOrgs: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
              fundingStatus: true,
              fundingAmount: true,
              category: true,
              fund: { select: { name: true, number: true } },
              githubUrl: true,
              githubOwner: true,
              githubRepo: true,
              githubActivityScore: true,
              githubStars: true,
              githubForks: true,
              githubLastCommit: true,
              githubLastSync: true,
            },
          },
        },
        orderBy: { project: { createdAt: "desc" } },
      },
    },
  });

  if (!organization) {
    notFound();
  }

  const projects = organization.projectOrgs.map((po) => po.project);

  const completionRate =
    organization.fundedProposalsCount > 0
      ? (organization.completedProposalsCount / organization.fundedProposalsCount) * 100
      : 0;

  const accountabilityScore =
    organization.accountabilityScore?.overallScore ??
    Math.min(
      100,
      Math.round(
        completionRate * 0.5 +
          (organization.fundedProposalsCount > 0 ? 20 : 0) +
          (organization.members.length > 1 ? 15 : 5) +
          (organization.website ? 10 : 0) +
          (organization.bio ? 5 : 0)
      )
    );

  const categoryCounts = projects.reduce(
    (acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const githubProjects = projects.filter((project) => project.githubUrl || project.githubActivityScore);
  const githubAverage =
    githubProjects.length > 0
      ? githubProjects.reduce((sum, project) => sum + (project.githubActivityScore || 0), 0) /
        githubProjects.length
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/organizations" className="hover:text-blue-600 dark:hover:text-blue-400">
            Organizations
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-white">{organization.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-8 flex items-start gap-6">
          {organization.heroImgUrl ? (
            <Image
              src={organization.heroImgUrl}
              alt={organization.name}
              width={80}
              height={80}
              className="h-20 w-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-700 text-3xl font-bold text-slate-400 dark:text-slate-500">
              {organization.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{organization.name}</h1>
              {organization.accountabilityScore && (
                <Badge
                  variant={getAccountabilityVariant(organization.accountabilityScore.overallScore)}
                  size="sm"
                >
                  {getAccountabilityLabel(organization.accountabilityScore.overallScore)}
                </Badge>
              )}
            </div>
            {organization.bio && (
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">{organization.bio}</p>
            )}
            {organization.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {organization.website}
              </a>
            )}
          </div>
        </header>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Total Funded
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(Number(organization.totalAmountAwarded))}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Received
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(Number(organization.totalAmountReceived))}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Projects
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {organization.fundedProposalsCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Completion Rate
            </p>
            <p
              className={`mt-2 text-2xl font-bold ${
                completionRate >= 70
                  ? "text-emerald-600 dark:text-emerald-400"
                  : completionRate >= 40
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {completionRate.toFixed(0)}%
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Accountability Score
            </p>
            <p
              className={`mt-2 text-2xl font-bold ${
                accountabilityScore >= 70
                  ? "text-emerald-600 dark:text-emerald-400"
                  : accountabilityScore >= 40
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {accountabilityScore}/100
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Connections
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Preview linked people and projects, then open a mini graph.
              </p>
            </div>
            <ConnectionHoverCard
              entityType="organization"
              entityId={organization.id}
              href={`/organizations/${organization.id}`}
            >
              <button
                type="button"
                className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Open connection explorer
              </button>
            </ConnectionHoverCard>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {githubProjects.length > 0 && (
              <Section title="GitHub Activity">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Repos tracked
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                      {githubProjects.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Avg activity score
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                      {githubAverage.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Recent commits
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                      {githubProjects.filter((project) => project.githubLastCommit).length}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {githubProjects.slice(0, 4).map((project) => (
                    <div
                      key={project.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{project.title}</p>
                        {project.githubOwner && project.githubRepo && (
                          <a
                            href={project.githubUrl || `https://github.com/${project.githubOwner}/${project.githubRepo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {project.githubOwner}/{project.githubRepo}
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Score: {project.githubActivityScore ?? "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Top Categories */}
            {topCategories.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Focus Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {topCategories.map(([category, count]) => (
                    <span
                      key={category}
                      className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-sm text-slate-700 dark:text-slate-300"
                    >
                      {category} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Projects ({projects.length})
                </h2>
              </div>
              {projects.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  No projects yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                            {project.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <span>{project.fund.name}</span>
                            <span>•</span>
                            <span>{project.category}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {formatCurrency(Number(project.fundingAmount))}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_COLORS[project.status] || STATUS_COLORS.pending
                            }`}
                          >
                            {project.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Team Members */}
          <div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                Team Members ({organization.members.length})
              </h2>
              {organization.members.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No team members listed.</p>
              ) : (
                <div className="space-y-4">
                  {organization.members.map((member) => (
                    <Link
                      key={member.person.id}
                      href={`/people/${member.person.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      {member.person.heroImgUrl ? (
                        <Image
                          src={member.person.heroImgUrl}
                          alt={member.person.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-600 text-sm font-medium text-slate-500 dark:text-slate-300">
                          {member.person.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {member.person.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {member.person.fundedProposalsCount} funded projects
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
