import Link from "next/link";
import { notFound } from "next/navigation";

import prisma from "../../../lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
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

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6">
    <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
    {children}
  </section>
);

export default async function PersonDetailPage({ params }: PageProps) {
  const { id } = await params;

  const person = await prisma.person.findUnique({
    where: { id },
    include: {
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

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/people"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to People
          </Link>
        </div>

        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{person.name}</h1>
              {person.aliases.length > 0 && (
                <p className="mt-1 text-sm text-slate-500">
                  Also known as: {person.aliases.join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Projects
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {projects.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total Funding (via projects)
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatCurrency(totalFunding)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Aliases
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {person.aliases.length}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {person.aliases.length > 0 && (
            <Section title="Aliases">
              <ul className="space-y-2">
                {person.aliases.map((alias, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2"
                  >
                    <span className="font-medium text-slate-700">{alias}</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      alias
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">
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
                    className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {project.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{project.fund.name}</span>
                        <span>•</span>
                        <span>{formatCurrency(Number(project.fundingAmount))}</span>
                        {project.role && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">{project.role}</span>
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
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Source URL
                </dt>
                <dd className="mt-1 break-all text-sm text-slate-700">
                  <a
                    href={person.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {person.sourceUrl}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Source Type
                </dt>
                <dd className="mt-1 text-sm text-slate-700">{person.sourceType}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Last Seen
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
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
