import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
        <header className="flex flex-col gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">
            DOGE View • PROOF
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            A public registry for Catalyst funding outcomes and accountability.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Explore projects, follow milestone delivery, and connect people to funding
            outcomes across Project Catalyst.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-emerald-300"
            >
              Browse projects
            </Link>
            <Link
              href="/rankings"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-white/40"
            >
              View rankings
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-emerald-400/40 px-6 py-3 text-sm font-semibold text-emerald-200 hover:border-emerald-300"
            >
              Sign in
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Explore Catalyst funds</h2>
            <p className="mt-2 text-sm text-slate-300">
              Track funding totals, categories, and delivery progress across rounds.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Verify outcomes</h2>
            <p className="mt-2 text-sm text-slate-300">
              See milestones, deliverables, and community feedback tied to each project.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Connect the graph</h2>
            <p className="mt-2 text-sm text-slate-300">
              Visualize the people, orgs, and funding networks behind Catalyst.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6">
          <h2 className="text-lg font-semibold text-emerald-100">Getting started</h2>
          <p className="mt-2 text-sm text-emerald-100/80">
            To ingest fresh Catalyst data, follow the setup checklist in
            <span className="font-semibold text-emerald-100"> SETUP_CHECKLIST.md</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
