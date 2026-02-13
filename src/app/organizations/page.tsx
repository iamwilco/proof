import Link from "next/link";
import Image from "next/image";
import prisma from "../../lib/prisma";
import ConnectionHoverCard from "../../components/ConnectionHoverCard";

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ sort?: string }>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
  }).format(value);

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sortBy = params.sort ?? "funded";

  const organizations = await prisma.organization.findMany({
    include: {
      accountabilityScore: true,
      members: {
        include: {
          person: {
            select: { id: true, name: true },
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
              fundingAmount: true,
            },
          },
        },
      },
    },
  });

  const orgsWithStats = organizations.map((org) => {
    const completionRate =
      org.fundedProposalsCount > 0
        ? (org.completedProposalsCount / org.fundedProposalsCount) * 100
        : 0;

    return {
      ...org,
      completionRate,
      memberCount: org.members.length,
      accountabilityScore: org.accountabilityScore?.overallScore ?? null,
    };
  });

  const sortedOrgs = [...orgsWithStats].sort((a, b) => {
    switch (sortBy) {
      case "funded":
        return Number(b.totalAmountAwarded) - Number(a.totalAmountAwarded);
      case "projects":
        return b.fundedProposalsCount - a.fundedProposalsCount;
      case "completion":
        return b.completionRate - a.completionRate;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const totalOrgs = organizations.length;
  const totalFunded = organizations.reduce(
    (sum, o) => sum + Number(o.totalAmountAwarded),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Organizations</h1>
          <p className="mt-2 text-sm text-slate-600">
            Teams and companies building on Cardano through Catalyst.
          </p>
        </header>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Organizations
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{totalOrgs}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Funding Awarded
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(totalFunded)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Avg Funding/Org
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalOrgs > 0 ? formatCurrency(totalFunded / totalOrgs) : "$0"}
            </p>
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-slate-500">Sort by:</span>
          <div className="flex gap-2">
            {[
              { key: "funded", label: "Most Funded" },
              { key: "projects", label: "Most Projects" },
              { key: "completion", label: "Completion Rate" },
              { key: "name", label: "Name" },
            ].map((option) => (
              <Link
                key={option.key}
                href={`/organizations?sort=${option.key}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  sortBy === option.key
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Organizations List */}
        {sortedOrgs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">No organizations found.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedOrgs.map((org) => (
              <ConnectionHoverCard
                key={org.id}
                entityType="organization"
                entityId={org.id}
                href={`/organizations/${org.id}`}
              >
                <Link
                  href={`/organizations/${org.id}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    {org.heroImgUrl ? (
                      <Image
                        src={org.heroImgUrl}
                        alt={org.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-slate-400">
                        {org.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                        {org.name}
                      </h2>
                      {org.bio && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {org.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Funded</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(Number(org.totalAmountAwarded))}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Projects</p>
                      <p className="font-semibold text-slate-900">
                        {org.fundedProposalsCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>{org.memberCount} members</span>
                    <span
                      className={`font-medium ${
                        org.completionRate >= 70
                          ? "text-emerald-600"
                          : org.completionRate >= 40
                            ? "text-amber-600"
                            : "text-slate-500"
                      }`}
                    >
                      {org.completionRate.toFixed(0)}% completion
                    </span>
                  </div>
                </Link>
              </ConnectionHoverCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
