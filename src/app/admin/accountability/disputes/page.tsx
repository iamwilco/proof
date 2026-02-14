import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import DisputeActions from "./DisputeActions";

export const dynamic = "force-dynamic";

export default async function AccountabilityDisputesPage() {
  const session = await getSession();
  const isAdmin = session?.user.role === "ADMIN" || session?.user.role === "MODERATOR";
  if (!isAdmin) {
    redirect("/login?redirect=/admin/accountability/disputes");
  }

  const disputes = await prisma.accountabilityScoreDispute.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      score: {
        include: {
          person: { select: { id: true, name: true } },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Accountability Disputes</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Review score disputes before scores are published.
          </p>
        </header>

        {disputes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            No disputes submitted.
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/people/${dispute.score.person.id}`}
                      className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {dispute.score.person.name}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Score #{dispute.scoreId.slice(0, 8)} · {dispute.status}
                    </p>
                  </div>
                  <DisputeActions disputeId={dispute.id} status={dispute.status} />
                </div>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{dispute.reason}</p>
                {dispute.evidence && (
                  <a
                    href={dispute.evidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View evidence
                  </a>
                )}
                {dispute.resolvedAt && (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Resolved {new Date(dispute.resolvedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
