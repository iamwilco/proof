import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "../../../lib/prisma";

export const revalidate = 60;

const formatCurrency = (amount: number, currency: string = "USD") => {
  if (currency === "ADA") {
    return `₳${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number) => {
  return `${Math.round(value * 100)}%`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
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

type SearchParams = {
  q?: string;
  status?: string;
  category?: string;
  sort?: string;
};

export default async function FundDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const query = (search.q ?? "").trim();
  const statusFilter = search.status ?? "";
  const categoryFilter = search.category ?? "";
  const sortBy = search.sort ?? "funding";

  // Support both UUID and fund number in URL
  const isUuid = id.includes("-");
  const fund = await prisma.fund.findFirst({
    where: isUuid ? { id } : { number: parseInt(id, 10) },
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

  // Get categories for this fund
  const categories = await prisma.project.findMany({
    where: { fundId: fund.id },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  // Get statuses for this fund
  const statuses = await prisma.project.findMany({
    where: { fundId: fund.id },
    select: { status: true },
    distinct: ["status"],
  });

  const completionRate = fund.fundedProposalsCount > 0
    ? fund.completedProposalsCount / fund.fundedProposalsCount
    : 0;

  const fundingRate = fund.proposalsCount > 0
    ? fund.fundedProposalsCount / fund.proposalsCount
    : 0;

  // Filter projects based on search params
  let filteredProjects = fund.projects;
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredProjects = filteredProjects.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
  }
  
  if (statusFilter) {
    filteredProjects = filteredProjects.filter((p) => p.status === statusFilter);
  }
  
  if (categoryFilter) {
    filteredProjects = filteredProjects.filter((p) => p.category === categoryFilter);
  }

  // Sort projects
  if (sortBy === "title") {
    filteredProjects = [...filteredProjects].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "category") {
    filteredProjects = [...filteredProjects].sort((a, b) => a.category.localeCompare(b.category));
  } else {
    // Default: sort by funding amount
    filteredProjects = [...filteredProjects].sort((a, b) => Number(b.fundingAmount) - Number(a.fundingAmount));
  }

  // Group projects by status
  const statusGroups = filteredProjects.reduce((acc, project) => {
    const status = project.status || "unknown";
    if (!acc[status]) acc[status] = [];
    acc[status].push(project);
    return acc;
  }, {} as Record<string, typeof filteredProjects>);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/funds" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Funds
          </Link>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{fund.name}</h1>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                fund.status === "awarded" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" :
                fund.status === "active" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              }`}>
                {fund.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(Number(fund.totalAwarded), fund.currency)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Awarded</p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{fund.proposalsCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Proposals</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fund.fundedProposalsCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Funded</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fund.completedProposalsCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatPercent(completionRate)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completion Rate</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatPercent(fundingRate)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Funding Rate</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(Number(fund.totalDistributed), fund.currency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distributed</p>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content - Projects */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Projects ({filteredProjects.length})
              </h2>
            </div>

            {/* Search and Filters */}
            <form method="GET" className="mb-6 flex flex-wrap items-center gap-3">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search projects..."
                className="h-10 w-48 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <select
                name="status"
                defaultValue={statusFilter}
                className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s.status} value={s.status}>
                    {s.status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <select
                name="category"
                defaultValue={categoryFilter}
                className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
              <select
                name="sort"
                defaultValue={sortBy}
                className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="funding">Sort by Funding</option>
                <option value="title">Sort by Title</option>
                <option value="category">Sort by Category</option>
              </select>
              <button
                type="submit"
                className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
              >
                Apply
              </button>
              {(query || statusFilter || categoryFilter) && (
                <Link
                  href={`/funds/${fund.number}`}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear
                </Link>
              )}
            </form>
            
            {filteredProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-12 text-center">
                <p className="text-slate-600 dark:text-slate-300">No projects match your filters</p>
              </div>
            ) : (
              Object.entries(statusGroups).map(([status, projects]) => (
                <div key={status} className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <StatusBadge status={status} />
                    <span>({projects.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                              {project.title}
                            </h4>
                            <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                              {project.category}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {formatCurrency(Number(project.fundingAmount), fund.currency)}
                            </p>
                            {project.projectPeople.length > 0 && (
                              <div className="mt-1 flex -space-x-2">
                                {project.projectPeople.map((pp) => (
                                  <div
                                    key={pp.person.id}
                                    className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-700 bg-slate-200 dark:bg-slate-600 text-xs flex items-center justify-center text-slate-700 dark:text-slate-200"
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
              ))
            )}
          </div>

          {/* Sidebar - Top Recipients */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Top Recipients</h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              {topPeople.length === 0 ? (
                <p className="p-4 text-sm text-slate-500 dark:text-slate-400">No data available</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {topPeople.map((person, idx) => (
                    <li key={person.id}>
                      <Link
                        href={`/people/${person.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                          {idx + 1}
                        </span>
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 text-sm flex items-center justify-center font-medium text-slate-700 dark:text-slate-200">
                          {person.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">
                            {person.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {person.projectCount} project{person.projectCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(Number(person.totalFunding), fund.currency)}
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
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
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
