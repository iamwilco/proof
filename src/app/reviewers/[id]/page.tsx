import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "../../../lib/prisma";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewerProfilePage({ params }: PageProps) {
  const { id } = await params;

  const reviewerProfile = await prisma.reviewerProfile.findUnique({
    where: { userId: id },
    include: {
      user: {
        select: { id: true, displayName: true, walletAddress: true, createdAt: true },
      },
    },
  });

  // Fallback to user with reviews if no profile
  const user = reviewerProfile?.user || await prisma.user.findUnique({
    where: { id },
    select: { id: true, displayName: true, walletAddress: true, createdAt: true },
  });

  if (!user) {
    notFound();
  }

  // Get review stats
  const reviews = await prisma.review.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: { id: true, title: true, fund: { select: { id: true, name: true } } },
      },
    },
  });

  const reviewStats = {
    total: reviews.length,
    helpful: reviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0),
    notHelpful: reviews.reduce((sum, r) => sum + (r.notHelpfulCount || 0), 0),
  };

  const helpfulRatio = reviewStats.helpful + reviewStats.notHelpful > 0
    ? reviewStats.helpful / (reviewStats.helpful + reviewStats.notHelpful)
    : 0;

  // Group reviews by fund
  const byFund: Record<string, { name: string; count: number }> = {};
  for (const review of reviews) {
    const fundId = review.project.fund.id;
    const fundName = review.project.fund.name;
    if (!byFund[fundId]) byFund[fundId] = { name: fundName, count: 0 };
    byFund[fundId].count++;
  }

  const fundsParticipated = Object.entries(byFund).sort((a, b) => b[1].count - a[1].count);

  // Badges
  const badges: string[] = [];
  if (reviewerProfile?.isVeteran || fundsParticipated.length >= 3) badges.push("Veteran Reviewer");
  if (reviewStats.total >= 50) badges.push("Prolific Reviewer");
  if (helpfulRatio >= 0.8 && reviewStats.total >= 10) badges.push("Helpful Reviewer");
  if (reviewerProfile?.badges) badges.push(...reviewerProfile.badges);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {user.displayName || `Reviewer ${user.id.slice(0, 8)}`}
              </h1>
              {reviewerProfile?.ideascaleUsername && (
                <p className="mt-1 text-sm text-slate-500">
                  @{reviewerProfile.ideascaleUsername} on Ideascale
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                Reviewer since {user.createdAt.toLocaleDateString()}
              </p>
            </div>
            {reviewerProfile?.isActive && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Active Reviewer
              </span>
            )}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
                >
                  🏅 {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Reviews
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{reviewStats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Helpful Votes
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{reviewStats.helpful}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Helpful Ratio
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {(helpfulRatio * 100).toFixed(0)}%
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Funds Participated
            </p>
            <p className="mt-2 text-2xl font-bold text-purple-600">{fundsParticipated.length}</p>
          </div>
        </div>

        {/* Funds Breakdown */}
        {fundsParticipated.length > 0 && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Review History by Fund</h2>
            <div className="space-y-3">
              {fundsParticipated.map(([fundId, data]) => (
                <div key={fundId} className="flex items-center justify-between">
                  <Link
                    href={`/funds/${fundId}`}
                    className="font-medium text-slate-700 hover:text-blue-600"
                  >
                    {data.name}
                  </Link>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    {data.count} reviews
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Reviews */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
            <h2 className="font-semibold text-slate-900">Recent Reviews</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {reviews.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                No reviews yet
              </div>
            ) : (
              reviews.slice(0, 20).map((review) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/projects/${review.project.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 line-clamp-1"
                      >
                        {review.project.title}
                      </Link>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                        {review.content}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                        <span>{review.project.fund.name}</span>
                        <span>{review.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <span className="text-sm text-emerald-600">👍 {review.helpfulCount || 0}</span>
                      <span className="text-sm text-red-600">👎 {review.notHelpfulCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Claim Profile CTA */}
        {!reviewerProfile && (
          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
            <h3 className="font-semibold text-blue-900">Is this your profile?</h3>
            <p className="mt-2 text-sm text-blue-700">
              Claim this reviewer profile to add badges, link your Ideascale account, and track your history.
            </p>
            <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Claim Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
