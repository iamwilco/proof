import Link from "next/link";
import { cookies } from "next/headers";
import { getRecommendations, getInteractionStats } from "../../lib/recommendations";

export const revalidate = 0;

export default async function RecommendationsPage() {
  // Get user ID from cookie or generate a temporary one
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value || "anonymous";

  const recommendations = await getRecommendations(userId, 12);
  const stats = getInteractionStats(userId);

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">For You</h1>
          <p className="mt-2 text-sm text-slate-600">
            Personalized proposal recommendations based on your activity.
          </p>
        </header>

        {/* User Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Projects Viewed
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.views}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Bookmarked
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{stats.bookmarks}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Votes Cast
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.votes}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Top Categories
            </p>
            <p className="mt-2 text-sm font-medium text-slate-700 truncate">
              {stats.preferredCategories.slice(0, 2).join(", ") || "Explore more!"}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mb-4 text-4xl">🔍</div>
            <h2 className="text-lg font-semibold text-slate-900">
              No personalized recommendations yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Start exploring proposals to get personalized recommendations.
            </p>
            <Link
              href="/projects"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Browse Projects
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map(({ project, score, reasons }) => (
              <div
                key={project.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition"
              >
                {/* Match Score */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {(score * 100).toFixed(0)}% match
                  </span>
                  <span className="text-xs text-slate-400">{project.fund.name}</span>
                </div>

                {/* Title */}
                <Link
                  href={`/projects/${project.id}`}
                  className="block font-semibold text-slate-900 hover:text-blue-600 line-clamp-2"
                >
                  {project.title}
                </Link>

                {/* Description */}
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                  {project.description}
                </p>

                {/* Meta */}
                <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                  <span className="rounded bg-slate-100 px-2 py-1">{project.category}</span>
                  <span>{formatCurrency(project.fundingAmount)} ADA</span>
                  <span
                    className={`rounded px-2 py-1 ${
                      project.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : project.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Reasons */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500">
                    <span className="font-medium">Why recommended:</span>
                  </p>
                  <ul className="mt-1 space-y-1">
                    {reasons.map((reason, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                        <span className="text-emerald-500">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900">Improve your recommendations</h3>
          <ul className="mt-3 space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span>👀</span>
              <span>View more project details to help us understand your interests</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🔖</span>
              <span>Bookmark projects you find interesting</span>
            </li>
            <li className="flex items-start gap-2">
              <span>👍</span>
              <span>Vote on proposals to refine your preferences</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
