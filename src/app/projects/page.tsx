import Link from "next/link";

import prisma from "../../lib/prisma";

export const revalidate = 60;

type SearchParams = {
  q?: string;
  fund?: string;
  status?: string;
  category?: string;
  cursor?: string;
};

const PAGE_SIZE = 12;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-blue-100 text-blue-700",
    funded: "bg-amber-100 text-amber-700",
    not_approved: "bg-slate-100 text-slate-600",
  };

  const colorClass = colors[status.toLowerCase()] ?? "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
};

type ProjectCardProps = {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  fundingAmount: number;
  fundName: string;
};

const ProjectCard = ({
  id,
  title,
  description,
  status,
  category,
  fundingAmount,
  fundName,
}: ProjectCardProps) => {
  return (
    <Link
      href={`/projects/${id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug text-slate-900 group-hover:text-blue-600">
          {title}
        </h3>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded bg-slate-100 px-2 py-0.5">{category}</span>
          <span>•</span>
          <span>{fundName}</span>
        </div>
        <p className="mt-2 text-base font-semibold text-slate-900">
          {formatCurrency(fundingAmount)}
        </p>
      </div>
    </Link>
  );
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const fundFilter = params.fund ?? "";
  const statusFilter = params.status ?? "";
  const categoryFilter = params.category ?? "";
  const cursor = params.cursor ?? "";

  const whereClause: Record<string, unknown> = {};

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (fundFilter) {
    whereClause.fundId = fundFilter;
  }

  if (statusFilter) {
    whereClause.status = statusFilter;
  }

  if (categoryFilter) {
    whereClause.category = categoryFilter;
  }

  const cursorObj = cursor ? { id: cursor } : undefined;

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      fund: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursorObj && { cursor: cursorObj, skip: 1 }),
  });

  const hasMore = projects.length > PAGE_SIZE;
  const displayProjects = hasMore ? projects.slice(0, PAGE_SIZE) : projects;
  const nextCursor = hasMore ? projects[PAGE_SIZE - 1]?.id : null;

  const [funds, statuses, categories] = await Promise.all([
    prisma.fund.findMany({ select: { id: true, name: true }, orderBy: { number: "desc" } }),
    prisma.project.findMany({ select: { status: true }, distinct: ["status"] }),
    prisma.project.findMany({ select: { category: true }, distinct: ["category"] }),
  ]);

  const buildPaginationUrl = (cursorValue: string) => {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (fundFilter) params.fund = fundFilter;
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    if (cursorValue) params.cursor = cursorValue;
    const qs = new URLSearchParams(params).toString();
    return qs ? `/projects?${qs}` : "/projects";
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="mt-2 text-base text-slate-600">
            Browse Catalyst-funded projects. Use the filters and search to find specific proposals.
          </p>
        </header>

        <section className="mb-8 flex flex-wrap items-center gap-3">
          <form method="GET" action="/projects" className="flex items-center gap-2">
            <input type="hidden" name="fund" value={fundFilter} />
            <input type="hidden" name="status" value={statusFilter} />
            <input type="hidden" name="category" value={categoryFilter} />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search projects…"
              className="h-10 w-64 rounded-lg border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <form method="GET" action="/projects" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="q" value={query} />
            <select
              name="fund"
              defaultValue={fundFilter}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Funds</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={statusFilter}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
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
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="h-10 rounded-lg bg-slate-700 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              Apply
            </button>

            {(query || fundFilter || statusFilter || categoryFilter) && (
              <Link
                href="/projects"
                className="ml-2 text-sm font-medium text-blue-600 hover:underline"
              >
                Clear filters
              </Link>
            )}
          </form>
        </section>

        {displayProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-lg font-medium text-slate-600">No projects found</p>
            <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  description={project.description}
                  status={project.status}
                  category={project.category}
                  fundingAmount={Number(project.fundingAmount)}
                  fundName={project.fund.name}
                />
              ))}
            </section>

            {(cursor || hasMore) && (
              <div className="mt-10 flex items-center justify-center gap-4">
                {cursor && (
                  <Link
                    href={buildPaginationUrl("")}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    ← First Page
                  </Link>
                )}
                {nextCursor && (
                  <Link
                    href={buildPaginationUrl(nextCursor)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Next Page →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
