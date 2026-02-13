"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CytoscapeComponent from "react-cytoscapejs";

import { Badge, Modal } from "@/components/ui";

type EntityType = "person" | "organization" | "project";

type ConnectionSummary = {
  id: string;
  type: EntityType;
  label: string;
  connectionType?: string;
  source: "admin" | "inferred";
};

type HoverCardPayload = {
  entity: {
    id: string;
    type: EntityType;
    name: string;
    stats: {
      projects: number | null;
      funding: number | null;
      score: number | null;
    };
  };
  connections: ConnectionSummary[];
  sharedProjects: Array<{
    id: string;
    title: string;
    fundName: string;
    fundingAmount: number;
  }>;
  graph: {
    nodes: Array<{ data: { id: string; label: string; type: EntityType } }>;
    edges: Array<{ data: { id: string; source: string; target: string; type: string } }>;
  };
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

const typeLabel: Record<EntityType, string> = {
  person: "Person",
  organization: "Organization",
  project: "Project",
};

const connectionLabel: Record<string, string> = {
  TEAM_MEMBER: "Team Member",
  FOUNDER: "Founder",
  ADVISOR: "Advisor",
  EMPLOYEE: "Employee",
  PARTNER: "Partner",
  CONTRACTOR: "Contractor",
  INVESTOR: "Investor",
  OTHER: "Other",
  linked: "Linked",
};

type ConnectionHoverCardProps = {
  entityType: EntityType;
  entityId: string;
  href: string;
  children: React.ReactNode;
};

export default function ConnectionHoverCard({
  entityType,
  entityId,
  href,
  children,
}: ConnectionHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [data, setData] = useState<HoverCardPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || data || loading) return;

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          type: entityType,
          id: entityId,
        });
        const response = await fetch(`/api/connections/preview?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as HoverCardPayload;
        setData(payload);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [isOpen, data, loading, entityType, entityId]);

  const graphElements = useMemo(() => {
    if (!data) return [];
    return [...data.graph.nodes, ...data.graph.edges];
  }, [data]);

  const sharedLabel = entityType === "project" ? "Shared proposals" : "Recent proposals";

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}

      <div className="pointer-events-none absolute left-1/2 top-full z-30 hidden w-96 -translate-x-1/2 pt-3 group-hover:block">
        <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {typeLabel[entityType]}
              </p>
              <p className="text-base font-semibold text-slate-900">
                {data?.entity.name ?? "Loading…"}
              </p>
            </div>
            <Badge variant={data?.connections.some((conn) => conn.source === "admin") ? "warning" : "info"} size="sm">
              {data?.connections.some((conn) => conn.source === "admin") ? "Admin Linked" : "Auto Linked"}
            </Badge>
          </div>

          {loading && !data ? (
            <p className="mt-3 text-sm text-slate-500">Fetching connections…</p>
          ) : (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-400">Projects</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {data?.entity.stats.projects ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-400">Funding</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {data?.entity.stats.funding ? formatCurrency(data.entity.stats.funding) : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-400">Score</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {data?.entity.stats.score ?? "—"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Connections
                </p>
                {data?.connections.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {data.connections.map((conn) => (
                      <li key={`${conn.type}-${conn.id}`} className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          {conn.label}
                          <span className="ml-2 text-xs text-slate-400">({typeLabel[conn.type]})</span>
                        </span>
                        <Badge variant={conn.source === "admin" ? "warning" : "default"} size="sm">
                          {connectionLabel[conn.connectionType ?? "linked"]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No connections found.</p>
                )}
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {sharedLabel}
                </p>
                {data?.sharedProjects.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {data.sharedProjects.map((project) => (
                      <li key={project.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          {project.title}
                          {project.fundName && (
                            <span className="ml-2 text-xs text-slate-400">{project.fundName}</span>
                          )}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {formatCurrency(project.fundingAmount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No shared proposals yet.</p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGraphOpen(true)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Show connections
                </button>
                <Link
                  href={href}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  View details
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        title="Connection explorer"
        description="Mini graph of nearby connections"
        size="lg"
      >
        {data ? (
          <div className="h-[380px] overflow-hidden rounded-xl border border-slate-200">
            <CytoscapeComponent
              elements={graphElements}
              layout={{ name: "cose", animate: true, fit: true, padding: 20 }}
              style={{ width: "100%", height: "100%" }}
              stylesheet={[
                {
                  selector: "node",
                  style: {
                    "background-color": "#2563eb",
                    label: "data(label)",
                    color: "#0f172a",
                    "font-size": 9,
                    "text-valign": "bottom",
                    "text-margin-y": 5,
                    width: 22,
                    height: 22,
                  },
                },
                {
                  selector: 'node[type = "person"]',
                  style: {
                    "background-color": "#f97316",
                    shape: "ellipse",
                    width: 26,
                    height: 26,
                  },
                },
                {
                  selector: 'node[type = "organization"]',
                  style: {
                    "background-color": "#10b981",
                    shape: "round-rectangle",
                    width: 28,
                    height: 28,
                  },
                },
                {
                  selector: "edge",
                  style: {
                    width: 1,
                    "line-color": "#cbd5e1",
                    "target-arrow-color": "#cbd5e1",
                    "target-arrow-shape": "triangle",
                    "curve-style": "bezier",
                    opacity: 0.7,
                  },
                },
              ]}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading graph…</p>
        )}
      </Modal>
    </div>
  );
}
