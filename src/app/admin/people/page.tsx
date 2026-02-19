"use client";

import { useState, useEffect, useCallback } from "react";

type EntityType = "UNKNOWN" | "INDIVIDUAL" | "ORGANIZATION";

interface PersonOrg {
  organization: { id: string; name: string };
  role: string | null;
}

interface Person {
  id: string;
  name: string;
  entityType: EntityType;
  proposalsCount: number;
  fundedProposalsCount: number;
  completedProposalsCount: number;
  organizations: PersonOrg[];
}

interface OrgOption {
  id: string;
  name: string;
}

const TYPE_LABELS: Record<EntityType, string> = {
  UNKNOWN: "Uncategorized",
  INDIVIDUAL: "Individual",
  ORGANIZATION: "Organization",
};

const TYPE_COLORS: Record<EntityType, string> = {
  UNKNOWN: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  INDIVIDUAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  ORGANIZATION: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
};

export default function AdminPeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkOrgId, setLinkOrgId] = useState("");
  const [linkRole, setLinkRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("entityType", filter);
    if (search) params.set("search", search);
    params.set("page", String(page));

    const res = await fetch(`/api/admin/people?${params}`);
    const data = await res.json();
    setPeople(data.people || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [filter, search, page]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch on filter/search/page change
  useEffect(() => { fetchPeople(); }, [filter, search, page]);

  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch("/api/admin/people/orgs");
        if (res.ok) {
          const data = await res.json();
          setOrgs(data.organizations || []);
        }
      } catch {
        // Fallback: no orgs available
      }
    }
    loadOrgs();
  }, []);

  const handleSetType = async (personId: string, entityType: EntityType) => {
    setActionLoading(true);
    await fetch("/api/admin/people", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId, entityType }),
    });
    setPeople((prev) =>
      prev.map((p) => (p.id === personId ? { ...p, entityType } : p))
    );
    setActionLoading(false);
  };

  const handleLink = async (personId: string) => {
    if (!linkOrgId) return;
    setActionLoading(true);
    await fetch("/api/admin/people", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        organizationId: linkOrgId,
        role: linkRole || null,
      }),
    });
    setLinkingId(null);
    setLinkOrgId("");
    setLinkRole("");
    setActionLoading(false);
    fetchPeople();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          People & Organizations
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Categorize entries as individuals or organizations and link people to their orgs.
          {total > 0 && <span className="ml-1 font-medium">{total} entries total</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {["all", "UNKNOWN", "INDIVIDUAL", "ORGANIZATION"].map((val) => (
            <button
              key={val}
              onClick={() => { setFilter(val); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === val
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {val === "all" ? "All" : TYPE_LABELS[val as EntityType]}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : people.length === 0 ? (
        <div className="py-12 text-center text-slate-500">No results found</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Name</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Type</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300 text-center">Proposals</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Linked Orgs</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {people.map((person) => (
                <tr key={person.id} className="bg-white dark:bg-slate-800">
                  <td className="px-4 py-3">
                    <a
                      href={`/people/${person.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {person.name}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[person.entityType]}`}>
                      {TYPE_LABELS[person.entityType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                    {person.proposalsCount}
                    {person.fundedProposalsCount > 0 && (
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                        ({person.fundedProposalsCount} funded)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {person.organizations.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {person.organizations.map((o) => (
                          <span
                            key={o.organization.id}
                            className="inline-block rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          >
                            {o.organization.name}
                            {o.role && <span className="ml-1 text-purple-500">({o.role})</span>}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {(["INDIVIDUAL", "ORGANIZATION", "UNKNOWN"] as EntityType[])
                        .filter((t) => t !== person.entityType)
                        .map((t) => (
                          <button
                            key={t}
                            onClick={() => handleSetType(person.id, t)}
                            disabled={actionLoading}
                            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${TYPE_COLORS[t]} opacity-60 hover:opacity-100 disabled:cursor-not-allowed`}
                            title={`Mark as ${TYPE_LABELS[t]}`}
                          >
                            {TYPE_LABELS[t]}
                          </button>
                        ))}
                      <button
                        onClick={() => setLinkingId(linkingId === person.id ? null : person.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      >
                        Link
                      </button>
                    </div>

                    {/* Inline linking form */}
                    {linkingId === person.id && (
                      <div className="mt-2 flex items-end gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                            Organization
                          </label>
                          <select
                            value={linkOrgId}
                            onChange={(e) => setLinkOrgId(e.target.value)}
                            className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          >
                            <option value="">Select org...</option>
                            {orgs.map((o) => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-28">
                          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                            Role
                          </label>
                          <input
                            type="text"
                            value={linkRole}
                            onChange={(e) => setLinkRole(e.target.value)}
                            placeholder="e.g. Founder"
                            className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={() => handleLink(person.id)}
                          disabled={!linkOrgId || actionLoading}
                          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
