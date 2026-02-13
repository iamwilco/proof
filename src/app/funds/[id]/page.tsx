import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "../../../lib/prisma";

export const revalidate = 60;

const formatADA = (amount: number) => {
  return `₳${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

const formatPercent = (value: number) => {
  return `${Math.round(value * 100)}%`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    complete: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-blue-100 text-blue-700",
    funded: "bg-amber-100 text-amber-700",
    not_approved: "bg-slate-100 text-slate-600",
  };
  const colorClass = colors[status.toLowerCase()] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
};

export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const fund = await prisma.fund.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { fundingAmount: "desc" },
        take: 50,
        include: {
          projectPeople: {
            include: { person: { select: { id: true, name: true, heroImgUrl: true } } },
            take: 3,
          },
        },
      },
    },
  });

  if (!fund) {
    notFound();
  }

  const completionRate = fund.fundedProposalsCount > 0
    ? fund.completedProposalsCount / fund.fundedProposalsCount
    : 0;

  const fundingRate = fund.proposalsCount > 0
    ? fund.fundedProposalsCount / fund.proposalsCount
    : 0;

  // Group projects by status
  const statusGroups = fund.projects.reduce((acc, project) => {
    const status = project.status || "unknown";
    if (!acc[status]) acc[status] = [];
    acc[status].push(project);
    return acc;
  }, {} as Record<string, typeof fund.projects>);

  // Get top recipients (people with most funding in this fund)
  const topPeople = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    heroImgUrl: string | null;
    totalFunding: number;
    projectCount: number;
  }>>`
    SELECT 
      p.id,
      p.name,
      p."heroImgUrl",
      COALESCE(SUM(pr."fundingAmount"), 0)::numeric as "totalFunding",
      COUNT(DISTINCT pr.id)::int as "projectCount"
    FROM "Person" p
    JOIN "ProjectPerson" pp ON pp."personId" = p.id
    JOIN "Project" pr ON pr.id = pp."projectId"
    WHERE pr."fundId" = ${id}
    GROUP BY p.id, p.name, p."heroImgUrl"
    ORDER BY "totalFunding" DESC
    LIMIT 10
  `;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/funds" className="text-sm text-blue-600 hover:underline">
            ← Back to Funds
          </Link>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{fund.name}</h1>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                fund.status === "awarded" ? "bg-emerald-100 text-emerald-700" :
                fund.status === "active" ? "bg-blue-100 text-blue-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                {fund.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">
                {formatADA(Number(fund.totalAwarded))}
              </p>
              <p className="text-sm text-slate-500">Total Awarded</p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-slate-900">{fund.proposalsCount}</p>
            <p className="text-xs text-slate-500">Total Proposals</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-emerald-600">{fund.fundedProposalsCount}</p>
            <p className="text-xs text-slate-500">Funded</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-blue-600">{fund.completedProposalsCount}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-amber-600">{formatPercent(completionRate)}</p>
            <p className="text-xs text-slate-500">Completion Rate</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-slate-900">{formatPercent(fundingRate)}</p>
            <p className="text-xs text-slate-500">Funding Rate</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-slate-900">
              {formatADA(Number(fund.totalDistributed))}
            </p>
            <p className="text-xs text-slate-500">Distributed</p>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content - Projects */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Projects ({fund.projects.length})
            </h2>
            
            {Object.entries(statusGroups).map(([status, projects]) => (
              <div key={status} className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <StatusBadge status={status} />
                  <span>({projects.length})</span>
                </h3>
                <div className="space-y-3">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 hover:text-blue-600">
                            {project.title}
                          </h4>
                          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                            {project.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {formatADA(Number(project.fundingAmount))}
                          </p>
                          {project.projectPeople.length > 0 && (
                            <div className="mt-1 flex -space-x-2">
                              {project.projectPeople.map((pp) => (
                                <div
                                  key={pp.person.id}
                                  className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 text-xs flex items-center justify-center"
                                  title={pp.person.name}
                                >
                                  {pp.person.name.charAt(0)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar - Top Recipients */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Top Recipients</h2>
            <div className="rounded-xl border border-slate-200 bg-white">
              {topPeople.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No data available</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {topPeople.map((person, idx) => (
                    <li key={person.id}>
                      <Link
                        href={`/people/${person.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-slate-50"
                      >
                        <span className="text-sm font-medium text-slate-400">
                          {idx + 1}
                        </span>
                        <div className="h-8 w-8 rounded-full bg-slate-200 text-sm flex items-center justify-center font-medium">
                          {person.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {person.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {person.projectCount} project{person.projectCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {formatADA(Number(person.totalFunding))}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 space-y-3">
              <Link
                href={`/graph?fund=${fund.id}`}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                View Knowledge Graph
              </Link>
              <Link
                href={`/projects?fund=${fund.id}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Browse All Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
