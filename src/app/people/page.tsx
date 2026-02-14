import Link from "next/link";
import Image from "next/image";

import prisma from "../../lib/prisma";
import AccountabilityBadge from "../../components/AccountabilityBadge";
import ConnectionHoverCard from "../../components/ConnectionHoverCard";

export const revalidate = 60;

type SearchParams = {
  q?: string;
  sort?: string;
  cursor?: string;
  view?: string;
};

const PAGE_SIZE = 24;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number) => {
  return `${Math.round(value * 100)}%`;
};

type PersonCardProps = {
  id: string;
  name: string;
  heroImgUrl: string | null;
  proposalsCount: number;
  fundedProposalsCount: number;
  completedProposalsCount: number;
  totalAmountAwarded: number;
  accountability?: {
    badge: string;
    overallScore: number;
  } | null;
};

const PersonCard = ({
  id,
  name,
  heroImgUrl,
  proposalsCount,
  fundedProposalsCount,
  completedProposalsCount,
  totalAmountAwarded,
  accountability,
}: PersonCardProps) => {
  const completionRate = fundedProposalsCount > 0
    ? completedProposalsCount / fundedProposalsCount
    : 0;

  return (
    <ConnectionHoverCard entityType="person" entityId={id} href={`/people/${id}`}>
      <Link
        href={`/people/${id}`}
        className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
            {heroImgUrl ? (
              <Image src={heroImgUrl} alt={name} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {accountability && (
              <AccountabilityBadge
                badge={accountability.badge as "trusted" | "reliable" | "unproven" | "concerning"}
                score={accountability.overallScore}
                size="sm"
              />
            )}
            {totalAmountAwarded > 0 && (
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {formatCurrency(totalAmountAwarded)}
              </span>
            )}
          </div>
        </div>
        <h3 className="mt-3 text-base font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {name}
        </h3>
        
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{proposalsCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Proposals</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{fundedProposalsCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Funded</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{completedProposalsCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
          </div>
        </div>

        {fundedProposalsCount > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400">Completion</span>
              <span className={completionRate >= 0.8 ? "text-emerald-600" : completionRate >= 0.5 ? "text-amber-600" : "text-red-600"}>
                {formatPercent(completionRate)}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-1.5 rounded-full ${completionRate >= 0.8 ? "bg-emerald-500" : completionRate >= 0.5 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${completionRate * 100}%` }}
              />
            </div>
          </div>
        )}
      </Link>
    </ConnectionHoverCard>
  );
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const cursor = params.cursor ?? "";
  const viewMode = params.view === "table" ? "table" : "grid";
  const sortBy = params.sort ?? "";

  const whereClause: Record<string, unknown> = {};

  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { aliases: { hasSome: [query] } },
    ];
  }

  const cursorObj = cursor ? { id: cursor } : undefined;

  const sortField = params.sort === "funding" ? "totalAmountAwarded" : 
                     params.sort === "projects" ? "proposalsCount" : "name";
  const sortDir = params.sort ? "desc" : "asc";

  const people = await prisma.person.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      heroImgUrl: true,
      proposalsCount: true,
      fundedProposalsCount: true,
      completedProposalsCount: true,
      totalAmountAwarded: true,
      accountabilityScore: {
        select: {
          badge: true,
          overallScore: true,
        },
      },
    },
    orderBy: { [sortField]: sortDir },
    take: PAGE_SIZE + 1,
    ...(cursorObj && { cursor: cursorObj, skip: 1 }),
  });

  const hasMore = people.length > PAGE_SIZE;
  const displayPeople = hasMore ? people.slice(0, PAGE_SIZE) : people;
  const nextCursor = hasMore ? people[PAGE_SIZE - 1]?.id : null;

  const buildPaginationUrl = (cursorValue: string) => {
    const searchParamsObj: Record<string, string> = {};
    if (query) searchParamsObj.q = query;
    if (sortBy) searchParamsObj.sort = sortBy;
    if (viewMode === "table") searchParamsObj.view = "table";
    if (cursorValue) searchParamsObj.cursor = cursorValue;
    const qs = new URLSearchParams(searchParamsObj).toString();
    return qs ? `/people?${qs}` : "/people";
  };

  const buildViewUrl = (view: string) => {
    const searchParamsObj: Record<string, string> = {};
    if (query) searchParamsObj.q = query;
    if (sortBy) searchParamsObj.sort = sortBy;
    if (view === "table") searchParamsObj.view = "table";
    const qs = new URLSearchParams(searchParamsObj).toString();
    return qs ? `/people?${qs}` : "/people";
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">People</h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
            Browse individuals involved in Catalyst-funded projects.
          </p>
        </header>

        <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <form method="GET" action="/people" className="flex items-center gap-2">
            <input type="hidden" name="view" value={viewMode} />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name or alias…"
              className="h-10 w-64 rounded-lg border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
            <select
              name="sort"
              defaultValue={sortBy}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Sort by Name</option>
              <option value="funding">Sort by Funding</option>
              <option value="projects">Sort by Projects</option>
            </select>
            <button
              type="submit"
              className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
            {query && (
              <Link
                href="/people"
                className="ml-2 text-sm font-medium text-blue-600 hover:underline"
              >
                Clear
              </Link>
            )}
          </form>

          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-600 p-1">
            <Link
              href={buildViewUrl("grid")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              Grid
            </Link>
            <Link
              href={buildViewUrl("table")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              Table
            </Link>
          </div>
        </section>

        {displayPeople.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-600 dark:bg-slate-800">
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No people found</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try adjusting your search.
            </p>
          </div>
        ) : (
          <>
            {viewMode === "table" ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Name</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">Proposals</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">Funded</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">Completed</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">Completion</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">Funding</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {displayPeople.map((person) => {
                      const completionRate = person.fundedProposalsCount > 0
                        ? person.completedProposalsCount / person.fundedProposalsCount
                        : 0;
                      return (
                        <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                          <td className="px-4 py-3">
                            <Link href={`/people/${person.id}`} className="flex items-center gap-3 font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                                {person.name.charAt(0).toUpperCase()}
                              </div>
                              {person.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{person.proposalsCount}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{person.fundedProposalsCount}</td>
                          <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">{person.completedProposalsCount}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={completionRate >= 0.8 ? "text-emerald-600" : completionRate >= 0.5 ? "text-amber-600" : "text-red-600"}>
                              {formatPercent(completionRate)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(Number(person.totalAmountAwarded))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {person.accountabilityScore ? (
                              <AccountabilityBadge
                                badge={person.accountabilityScore.badge as "trusted" | "reliable" | "unproven" | "concerning"}
                                score={person.accountabilityScore.overallScore}
                                size="sm"
                              />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <section className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {displayPeople.map((person) => (
                  <PersonCard
                    key={person.id}
                    id={person.id}
                    name={person.name}
                    heroImgUrl={person.heroImgUrl}
                    proposalsCount={person.proposalsCount}
                    fundedProposalsCount={person.fundedProposalsCount}
                    completedProposalsCount={person.completedProposalsCount}
                    totalAmountAwarded={Number(person.totalAmountAwarded)}
                    accountability={person.accountabilityScore}
                  />
                ))}
              </section>
            )}

            {(cursor || hasMore) && (
              <div className="mt-10 flex items-center justify-center gap-4">
                {cursor && (
                  <Link
                    href={buildPaginationUrl("")}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
