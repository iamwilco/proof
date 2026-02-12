import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "../../../lib/prisma";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-blue-100 text-blue-700",
  funded: "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
  }).format(value);

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      createdBy: {
        select: { id: true, displayName: true },
      },
      projects: {
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
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!community) {
    notFound();
  }

  const projects = community.projects.map((cp) => cp.project);
  const totalFunding = projects.reduce(
    (sum, p) => sum + Number(p.fundingAmount),
    0
  );
  const completedCount = projects.filter((p) => p.status === "completed").length;
  const inProgressCount = projects.filter((p) => p.status === "in_progress").length;

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

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/communities" className="hover:text-blue-600">
            Communities
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{community.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{community.name}</h1>
          {community.description && (
            <p className="mt-2 text-lg text-slate-600">{community.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
            <span>
              Created by{" "}
              <span className="font-medium text-slate-700">
                {community.createdBy.displayName || "Anonymous"}
              </span>
            </span>
            <span>•</span>
            <span>{new Date(community.createdAt).toLocaleDateString()}</span>
          </div>
        </header>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Projects
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{projects.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Funding
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(totalFunding)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Completed
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{completedCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              In Progress
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{inProgressCount}</p>
          </div>
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Top Categories</h2>
            <div className="flex flex-wrap gap-2">
              {topCategories.map(([category, count]) => (
                <span
                  key={category}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  {category} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects List */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Projects ({projects.length})
            </h2>
          </div>
          {projects.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No projects in this community yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block px-6 py-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-slate-900 hover:text-blue-600">
                        {project.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                        <span>{project.fund.name}</span>
                        <span>•</span>
                        <span>{project.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">
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
    </div>
  );
}
