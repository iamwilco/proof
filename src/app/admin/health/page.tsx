import prisma from "../../../lib/prisma";

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

const StatCard = ({ label, value, helper }: StatCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      {helper ? (
        <p className="mt-2 text-sm text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
};

const formatTimestamp = (value: Date | null) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
};

export default async function AdminHealthPage() {
  const baseUrl = getBaseUrl();
  const [fundsCount, projectsCount, peopleCount, latestProject, healthCheck] =
    await Promise.all([
      prisma.fund.count(),
      prisma.project.count(),
      prisma.person.count(),
      prisma.project.aggregate({
        _max: {
          updatedAt: true,
        },
      }),
      fetch(`${baseUrl}/api/health`, { cache: "no-store" }).then(async (res) => {
        if (!res.ok) {
          return { status: "error" };
        }
        return (await res.json()) as { status: string; dbLatencyMs?: number };
      }),
    ]);

  const latestIngestionAt = latestProject._max.updatedAt ?? null;
  const dbLatency =
    healthCheck.status === "ok" && typeof healthCheck.dbLatencyMs === "number"
      ? `${healthCheck.dbLatencyMs} ms`
      : "Unavailable";
  const healthStatus = healthCheck.status === "ok" ? "Online" : "Degraded";

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
            Data Health
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            PROOF Admin Health Check
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300">
            A lightweight status view of ingestion coverage and freshness. Counts
            are derived from the current PostgreSQL dataset.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <StatCard label="Funds" value={fundsCount} />
          <StatCard label="Projects" value={projectsCount} />
          <StatCard label="People" value={peopleCount} />
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <StatCard
            label="Last Ingestion"
            value={formatTimestamp(latestIngestionAt)}
            helper="Derived from the latest Project.updatedAt value."
          />
          <StatCard
            label="Database Latency"
            value={dbLatency}
            helper="Measured from /api/health database ping."
          />
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <StatCard
            label="Uptime Status"
            value={healthStatus}
            helper="Derived from the /api/health endpoint."
          />
          <StatCard
            label="Health Endpoint"
            value="/api/health"
            helper="Use this URL for uptime monitoring checks."
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Checklist</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Catalyst proposal ingestion currently blocked.</li>
            <li>• Identity resolution + link extraction complete.</li>
            <li>• Middleware gate requires ADMIN_TOKEN + x-admin-token header.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
