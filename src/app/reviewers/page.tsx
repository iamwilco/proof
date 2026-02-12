import Link from "next/link";

import prisma from "../../lib/prisma";

export const revalidate = 60;

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export default async function ReviewersPage() {
  const reviewerStats = await prisma.review.groupBy({
    by: ["userId"],
    _count: { _all: true },
    _sum: { helpfulCount: true, notHelpfulCount: true },
    orderBy: { _sum: { helpfulCount: "desc" } },
    take: 100,
  });

  const userIds = reviewerStats.map((row) => row.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, walletAddress: true },
  });

  const userMap = new Map(users.map((user) => [user.id, user]));

  const leaderboard = reviewerStats.map((row) => {
    const helpful = row._sum.helpfulCount ?? 0;
    const notHelpful = row._sum.notHelpfulCount ?? 0;
    const totalVotes = helpful + notHelpful;
    const helpfulRatio = totalVotes > 0 ? helpful / totalVotes : 0;
    const user = userMap.get(row.userId);

    return {
      userId: row.userId,
      name: user?.displayName || user?.walletAddress || "Anonymous",
      reviews: row._count._all,
      helpfulRatio,
      helpful,
      notHelpful,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Reviewer Leaderboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Top 100 reviewers ranked by helpful votes and contribution volume.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Reviewer</th>
                <th className="px-5 py-3">Reviews</th>
                <th className="px-5 py-3">Helpful Ratio</th>
                <th className="px-5 py-3">Votes</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No reviewer data yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row, index) => (
                  <tr key={row.userId} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold text-slate-700">{index + 1}</td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/reviewers/${row.userId}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{row.reviews}</td>
                    <td className="px-5 py-4 text-slate-700">
                      {formatPercent(row.helpfulRatio)}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {row.helpful} helpful · {row.notHelpful} not helpful
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
