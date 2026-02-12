"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CytoscapeComponent from "react-cytoscapejs";

type GraphNode = {
  data: {
    id: string;
    label: string;
    type: "project" | "person" | "fund";
    funding?: number;
    status?: string;
    completionRate?: number;
  };
};

type GraphEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    type: "fund_project" | "project_person";
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
  });
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

    const nodes = payload.nodes.filter((node) => allowedTypes.has(node.data.type));
    const nodeIds = new Set(nodes.map((node) => node.data.id));
    const edges = payload.edges.filter(
      (edge) => nodeIds.has(edge.data.source) && nodeIds.has(edge.data.target)
    );

    return [...nodes, ...edges];
  }, [payload, activeTypes]);

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
