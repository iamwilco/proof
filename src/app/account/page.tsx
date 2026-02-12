import Link from "next/link";

import { createSupabaseServerClient } from "../../lib/supabase/server";
import prisma from "../../lib/prisma";

const tierForScore = (score: number) => {
  if (score >= 100) return "platinum";
  if (score >= 50) return "gold";
  if (score >= 20) return "silver";
  return "bronze";
};

const refreshReputation = async (userId: string) => {
  const concerns = await prisma.concern.findMany({
    where: { userId },
    select: { status: true },
  });

  const approvedCount = concerns.filter((c) => c.status === "approved").length;
  const rejectedCount = concerns.filter((c) => c.status === "rejected").length;
  const score = approvedCount * 10 + rejectedCount * -5;
  const tier = tierForScore(score);

  return prisma.$transaction(async (tx) => {
    const reputation = await tx.reputation.upsert({
      where: { userId },
      create: { userId, score, tier },
      update: { score, tier },
    });

    await tx.reputationEvent.deleteMany({ where: { userId } });

    const events = [];
    if (approvedCount > 0) {
      events.push({
        reputationId: reputation.id,
        userId,
        change: approvedCount * 10,
        reason: `Approved concerns: ${approvedCount}`,
      });
    }
    if (rejectedCount > 0) {
      events.push({
        reputationId: reputation.id,
        userId,
        change: rejectedCount * -5,
        reason: `Rejected concerns: ${rejectedCount}`,
      });
    }

    if (events.length > 0) {
      await tx.reputationEvent.createMany({ data: events });
    }

    return reputation;
  });
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Sign in required</h1>
          <p className="mt-2 text-sm text-slate-600">
            Please sign in to access your account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const reputation = await refreshReputation(data.user.id);
  const history = await prisma.reputationEvent.findMany({
    where: { userId: data.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as <span className="font-medium">{data.user.email}</span>
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Reputation
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                {reputation.score} pts
              </p>
              <p className="text-sm text-slate-500 capitalize">{reputation.tier} tier</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700">Reputation history</h2>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No reputation events yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {history.map((event) => (
                <li key={event.id} className="flex items-center justify-between">
                  <span>{event.reason}</span>
                  <span className={event.change >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    {event.change >= 0 ? "+" : ""}
                    {event.change}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form action="/auth/sign-out" method="post" className="mt-6">
          <button
            type="submit"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
