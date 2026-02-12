import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import prisma from "../../../lib/prisma";
import FeedbackForm from "./FeedbackForm";
import LeaderResponsePanel from "./LeaderResponsePanel";

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

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-blue-100 text-blue-700",
    funded: "bg-amber-100 text-amber-700",
    not_approved: "bg-slate-100 text-slate-600",
  };

  const colorClass = colors[status.toLowerCase()] ?? "bg-slate-100 text-slate-600";

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
  <section className="rounded-2xl border border-slate-200 bg-white p-6">
    <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
    {children}
  </section>
);

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
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
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/projects"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Projects
          </Link>
        </div>

        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
              <p className="mt-2 text-base text-slate-600">{project.description}</p>
            </div>
            <StatusBadge status={project.status} />
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Funding
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatCurrency(Number(project.fundingAmount))}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Fund
              </p>
              <p className="mt-1 text-base font-medium text-slate-900">
                {project.fund.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Category
              </p>
              <p className="mt-1 text-base text-slate-700">{project.category}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Status
              </p>
              <p className="mt-1 text-base text-slate-700">
                {project.status.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <FeedbackForm projectId={project.id} />
          <LeaderResponsePanel
            projectId={project.id}
            concerns={project.concerns.map((concern) => ({
              id: concern.id,
              description: concern.description,
              category: concern.category,
              status: concern.status,
            }))}
          />

          {project.concerns.length > 0 && (
            <Section title="Concerns & Responses">
              <div className="space-y-4">
                {project.concerns.map((concern) => (
                  <div
                    key={concern.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {concern.category}
                        </p>
                        <p className="text-xs text-slate-500">{concern.status}</p>
                      </div>
                      {concern.evidenceUrl && (
                        <a
                          href={concern.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Evidence
                        </a>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {concern.description}
                    </p>
                    {concern.responses.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                        {concern.responses.map((response) => (
                          <div
                            key={response.id}
                            className="rounded-md bg-white px-3 py-2 text-sm text-slate-700"
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
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {pp.person.name}
                    </Link>
                    {pp.role && (
                      <span className="text-sm text-slate-500">{pp.role}</span>
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
                    <span className="font-medium text-slate-800">
                      {po.organization.name}
                    </span>
                    {po.role && (
                      <span className="text-sm text-slate-500">{po.role}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {project.milestones.length > 0 && (
            <Section title="Milestones">
              <div className="space-y-4">
                {project.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {milestone.title}
                        </h3>
                        {milestone.dueDate && (
                          <p className="mt-1 text-sm text-slate-500">
                            Due: {formatDate(milestone.dueDate)}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={milestone.status} />
                    </div>

                    {milestone.deliverables.length > 0 && (
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Deliverables
                        </p>
                        <ul className="space-y-1">
                          {milestone.deliverables.map((d) => (
                            <li
                              key={d.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-slate-700">{d.title}</span>
                              <span
                                className={`text-xs ${
                                  d.status === "completed"
                                    ? "text-emerald-600"
                                    : "text-slate-400"
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
                    <span className="text-slate-700">{d.title}</span>
                    <span
                      className={`text-sm ${
                        d.status === "completed"
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      {d.status.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {project.links.length > 0 && (
            <Section title="External Links">
              <ul className="space-y-2">
                {project.links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline"
                    >
                      <LinkIcon type={link.type} />
                      <span className="text-sm">{link.url}</span>
                    </a>
                    <span className="ml-6 text-xs text-slate-400">
                      {link.type.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
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
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {project.sourceUrl}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Source Type
                </dt>
                <dd className="mt-1 text-sm text-slate-700">{project.sourceType}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Last Seen
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {formatDate(project.lastSeenAt)}
                </dd>
              </div>
            </dl>
          </Section>

          <footer className="text-center text-xs text-slate-400">
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
