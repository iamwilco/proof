"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CytoscapeComponent from "react-cytoscapejs";

type GraphNode = {
  data: {
    id: string;
    label: string;
    type: "project" | "person" | "fund" | "organization";
    funding?: number;
    status?: string;
    completionRate?: number;
    accountabilityScore?: number;
    badge?: string;
    flagCount?: number;
  };
};

type GraphEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    type: "fund_project" | "project_person";
    funding?: number;
    fundingLabel?: string;
  };
};

type GraphPayload = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats?: {
    projects: number;
    people: number;
    funds: number;
    links: number;
  };
  clusters?: Array<{
    id: string;
    nodes: string[];
    fundingTotal: number;
  }>;
  centrality?: Record<string, number>;
};

const typeLabels: Record<GraphNode["data"]["type"], string> = {
  project: "Projects",
  person: "People",
  fund: "Funds",
  organization: "Organizations",
};

const getScoreColor = (score?: number): string => {
  if (score === undefined) return "#94a3b8"; // slate-400
  if (score >= 80) return "#10b981"; // emerald-500 (TRUSTED)
  if (score >= 60) return "#3b82f6"; // blue-500 (RELIABLE)
  if (score >= 40) return "#f59e0b"; // amber-500 (UNPROVEN)
  return "#ef4444"; // red-500 (CONCERNING)
};

const getBadgeLabel = (badge?: string): string => {
  if (!badge) return "Unknown";
  return badge.charAt(0) + badge.slice(1).toLowerCase();
};

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

export default function GraphClient() {
  const searchParams = useSearchParams();
  const fundFilter = searchParams.get("fund") || "";
  
  const [payload, setPayload] = useState<GraphPayload>({ nodes: [], edges: [] });
  const [activeTypes, setActiveTypes] = useState<Record<string, boolean>>({
    project: true,
    person: true,
    fund: true,
    organization: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"default" | "centrality" | "clusters" | "funding">("default");
  const [highlightCluster, setHighlightCluster] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (fundFilter) params.set("fund", fundFilter);
        params.set("limit", "150");
        const res = await fetch(`/api/graph?${params}`);
        const data = (await res.json()) as GraphPayload;
        setPayload(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fundFilter]);

  const filtered = useMemo(() => {
    const allowedTypes = new Set(
      Object.entries(activeTypes)
        .filter(([, value]) => value)
        .map(([key]) => key)
    );

    let nodes = payload.nodes.filter((node) => allowedTypes.has(node.data.type));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter((node) =>
        node.data.label.toLowerCase().includes(query)
      );
    }

    // Apply score filter
    if (scoreFilter !== "all") {
      nodes = nodes.filter((node) => {
        const score = node.data.accountabilityScore;
        if (score === undefined) return scoreFilter === "unknown";
        if (scoreFilter === "trusted") return score >= 80;
        if (scoreFilter === "reliable") return score >= 60 && score < 80;
        if (scoreFilter === "unproven") return score >= 40 && score < 60;
        if (scoreFilter === "concerning") return score < 40;
        return true;
      });
    }

    // Apply flagged filter
    if (showFlaggedOnly) {
      nodes = nodes.filter((node) => (node.data.flagCount || 0) > 0);
    }

    const nodeIds = new Set(nodes.map((node) => node.data.id));
    const edges = payload.edges.filter(
      (edge) => nodeIds.has(edge.data.source) && nodeIds.has(edge.data.target)
    );

    // Highlight search matches
    const highlightedNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        highlighted: searchQuery.trim()
          ? node.data.label.toLowerCase().includes(searchQuery.toLowerCase())
          : false,
      },
    }));

    return [...highlightedNodes, ...edges];
  }, [payload, activeTypes, searchQuery, scoreFilter, showFlaggedOnly]);

  const toggleType = (type: GraphNode["data"]["type"]) => {
    setActiveTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleNodeClick = (nodeData: GraphNode["data"]) => {
    setSelectedNode(nodeData);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Knowledge Graph</h2>
          <p className="text-sm text-slate-500">
            {payload.stats ? (
              <>{payload.stats.projects} projects, {payload.stats.people} people, {payload.stats.links} connections</>
            ) : (
              "Explore relationships between projects, people, and funds."
            )}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-3">
          {(Object.keys(typeLabels) as GraphNode["data"]["type"][]).map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm"
            >
              <input
                type="checkbox"
                checked={activeTypes[type]}
                onChange={() => toggleType(type)}
                className="accent-blue-600"
              />
              <span className="text-slate-700">{typeLabels[type]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 pl-9 text-sm focus:border-blue-500 focus:outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All Scores</option>
          <option value="trusted">Trusted (80+)</option>
          <option value="reliable">Reliable (60-79)</option>
          <option value="unproven">Unproven (40-59)</option>
          <option value="concerning">Concerning (&lt;40)</option>
          <option value="unknown">No Score</option>
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={showFlaggedOnly}
            onChange={(e) => setShowFlaggedOnly(e.target.checked)}
            className="accent-red-600"
          />
          <span className="text-slate-700">Flagged Only</span>
        </label>
        <span className="text-sm text-slate-500">
          Showing {filtered.filter((el) => "type" in el.data).length} nodes
        </span>
      </div>

      {/* View Mode Selector */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500">View:</span>
        {[
          { key: "default", label: "Default" },
          { key: "centrality", label: "Centrality" },
          { key: "clusters", label: "Clusters" },
          { key: "funding", label: "Funding Flow" },
        ].map((mode) => (
          <button
            key={mode.key}
            onClick={() => setViewMode(mode.key as typeof viewMode)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              viewMode === mode.key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Cluster Legend */}
      {viewMode === "clusters" && payload.clusters && payload.clusters.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Clusters:</span>
          {payload.clusters.map((cluster, idx) => (
            <button
              key={cluster.id}
              onClick={() => setHighlightCluster(highlightCluster === cluster.id ? null : cluster.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                highlightCluster === cluster.id
                  ? "bg-purple-600 text-white"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              }`}
            >
              Cluster {idx + 1} ({cluster.nodes.length} nodes, {formatCurrency(cluster.fundingTotal)})
            </button>
          ))}
        </div>
      )}

      {/* Centrality Info */}
      {viewMode === "centrality" && payload.centrality && (
        <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <strong>Centrality View:</strong> Node size indicates influence based on connections. 
          Larger nodes have more relationships in the network.
        </div>
      )}

      {/* Funding Flow Info */}
      {viewMode === "funding" && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          <strong>Funding Flow:</strong> Edge thickness indicates funding amount. 
          Thicker lines represent larger funding relationships.
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <div className="flex-1 h-[520px] overflow-hidden rounded-2xl border border-slate-200">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Loading graph…
            </div>
          ) : (
            <CytoscapeComponent
              elements={filtered}
              layout={{ name: "cose", animate: true, fit: true, padding: 30 }}
              style={{ width: "100%", height: "100%" }}
              cy={(cy) => {
                cy.on("tap", "node", (evt) => {
                  handleNodeClick(evt.target.data());
                });
              }}
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
                    width: 20,
                    height: 20,
                  },
                },
                {
                  selector: 'node[type = "person"]',
                  style: {
                    "background-color": "#f97316",
                    shape: "ellipse",
                    width: 25,
                    height: 25,
                  },
                },
                {
                  selector: 'node[type = "organization"]',
                  style: {
                    "background-color": "#8b5cf6",
                    shape: "round-rectangle",
                    width: 30,
                    height: 25,
                  },
                },
                {
                  selector: 'node[type = "fund"]',
                  style: {
                    "background-color": "#10b981",
                    shape: "diamond",
                    width: 35,
                    height: 35,
                    "font-size": 11,
                    "font-weight": "bold",
                  },
                },
                // Score-based coloring for people (builder/grifter visualization)
                {
                  selector: 'node[type = "person"][badge = "TRUSTED"]',
                  style: { "background-color": "#10b981", "border-width": 3, "border-color": "#059669" },
                },
                {
                  selector: 'node[type = "person"][badge = "RELIABLE"]',
                  style: { "background-color": "#3b82f6", "border-width": 2, "border-color": "#2563eb" },
                },
                {
                  selector: 'node[type = "person"][badge = "UNPROVEN"]',
                  style: { "background-color": "#f59e0b", "border-width": 1, "border-color": "#d97706" },
                },
                {
                  selector: 'node[type = "person"][badge = "CONCERNING"]',
                  style: { "background-color": "#ef4444", "border-width": 3, "border-color": "#dc2626" },
                },
                // Flagged nodes get a red ring
                {
                  selector: "node[flagCount > 0]",
                  style: { "border-width": 4, "border-color": "#ef4444", "border-style": "dashed" },
                },
                // Highlighted search matches
                {
                  selector: "node[highlighted]",
                  style: { "border-width": 4, "border-color": "#fbbf24", "border-style": "solid" },
                },
                {
                  selector: "edge",
                  style: {
                    width: 1,
                    "line-color": "#cbd5e1",
                    "target-arrow-color": "#cbd5e1",
                    "target-arrow-shape": "triangle",
                    "curve-style": "bezier",
                    opacity: 0.6,
                  },
                },
                // Funding flow edges - show labels and thicker lines
                {
                  selector: 'edge[type = "fund_project"]',
                  style: {
                    width: 2,
                    "line-color": "#10b981",
                    "target-arrow-color": "#10b981",
                    label: viewMode === "funding" ? "data(fundingLabel)" : "",
                    "font-size": 8,
                    "text-background-color": "#ffffff",
                    "text-background-opacity": 0.9,
                    "text-background-padding": "2px",
                    color: "#047857",
                  },
                },
                // High-value funding edges (>$100K)
                {
                  selector: 'edge[funding > 100000]',
                  style: {
                    width: viewMode === "funding" ? 4 : 2,
                    "line-color": "#059669",
                  },
                },
                // Very high-value funding edges (>$500K)
                {
                  selector: 'edge[funding > 500000]',
                  style: {
                    width: viewMode === "funding" ? 6 : 3,
                    "line-color": "#047857",
                  },
                },
              ]}
            />
          )}
        </div>

        {/* Selected Node Panel */}
        {selectedNode && (
          <div className="w-72 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                selectedNode.type === "fund" ? "bg-emerald-100 text-emerald-700" :
                selectedNode.type === "person" ? "bg-orange-100 text-orange-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {selectedNode.type}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <h3 className="mt-2 font-semibold text-slate-900">{selectedNode.label}</h3>
            
            {selectedNode.funding !== undefined && selectedNode.funding > 0 && (
              <p className="mt-2 text-lg font-bold text-slate-900">
                {formatCurrency(selectedNode.funding)}
              </p>
            )}
            
            {selectedNode.accountabilityScore !== undefined && (
              <div className="mt-3">
                <p className="text-xs text-slate-500">Accountability Score</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${selectedNode.accountabilityScore}%`,
                        backgroundColor: getScoreColor(selectedNode.accountabilityScore)
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold" style={{ color: getScoreColor(selectedNode.accountabilityScore) }}>
                    {selectedNode.accountabilityScore}
                  </span>
                </div>
                {selectedNode.badge && (
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    selectedNode.badge === "TRUSTED" ? "bg-emerald-100 text-emerald-700" :
                    selectedNode.badge === "RELIABLE" ? "bg-blue-100 text-blue-700" :
                    selectedNode.badge === "UNPROVEN" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {getBadgeLabel(selectedNode.badge)}
                  </span>
                )}
              </div>
            )}

            {selectedNode.flagCount !== undefined && selectedNode.flagCount > 0 && (
              <div className="mt-2 rounded-lg bg-red-50 p-2">
                <p className="text-xs font-medium text-red-700">
                  ⚠️ {selectedNode.flagCount} confirmed flag{selectedNode.flagCount > 1 ? "s" : ""}
                </p>
              </div>
            )}

            {selectedNode.completionRate !== undefined && selectedNode.completionRate > 0 && (
              <div className="mt-2">
                <p className="text-xs text-slate-500">Completion Rate</p>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${selectedNode.completionRate * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {Math.round(selectedNode.completionRate * 100)}%
                </p>
              </div>
            )}

            {selectedNode.status && (
              <p className="mt-2 text-sm text-slate-600">
                Status: <span className="font-medium">{selectedNode.status}</span>
              </p>
            )}

            <a
              href={`/${selectedNode.type === "fund" ? "funds" : selectedNode.type === "person" ? "people" : "projects"}/${selectedNode.id.split("-").slice(1).join("-")}`}
              className="mt-4 block rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
            >
              View Details
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
