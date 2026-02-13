import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "../../../lib/prisma";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

const roleLabels: Record<string, string> = {
  moderator: "Moderator",
  senior_moderator: "Senior Moderator",
  admin: "Administrator",
};

export default async function ModeratorProfilePage({ params }: PageProps) {
  const { id } = await params;

  const moderatorProfile = await prisma.moderatorProfile.findUnique({
    where: { userId: id },
    include: {
      user: {
        select: { id: true, displayName: true, walletAddress: true, createdAt: true },
      },
    },
  });

  if (!moderatorProfile) {
    notFound();
  }

  const user = moderatorProfile.user;

  // Calculate tenure
  const now = new Date();
  const tenureDays = Math.floor(
    (now.getTime() - moderatorProfile.appointedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const tenureYears = Math.floor(tenureDays / 365);
  const tenureMonths = Math.floor((tenureDays % 365) / 30);

  // Badges
  const badges: string[] = [...moderatorProfile.badges];
  if (tenureDays >= 365) badges.push("Veteran Moderator");
  if (moderatorProfile.actionsCount >= 100) badges.push("Active Moderator");
  if (moderatorProfile.flagsResolved >= 50) badges.push("Flag Hunter");

  // Get scope funds if applicable
  const scopeFunds = moderatorProfile.scope.includes("global")
    ? null
    : await prisma.fund.findMany({
        where: { id: { in: moderatorProfile.scope } },
        select: { id: true, name: true },
      });

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {user.displayName || `Moderator ${user.id.slice(0, 8)}`}
                </h1>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                  {roleLabels[moderatorProfile.role] || moderatorProfile.role}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Appointed {moderatorProfile.appointedAt.toLocaleDateString()}
                {tenureYears > 0 && ` • ${tenureYears}y ${tenureMonths}m tenure`}
                {tenureYears === 0 && tenureMonths > 0 && ` • ${tenureMonths}m tenure`}
              </p>
            </div>
            {moderatorProfile.isActive ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Active
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                Inactive
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
                  🛡️ {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Actions
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {moderatorProfile.actionsCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Flags Resolved
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {moderatorProfile.flagsResolved}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Reports Handled
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {moderatorProfile.reportsHandled}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Warnings Issued
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {moderatorProfile.warningsIssued}
            </p>
          </div>
        </div>

        {/* Scope */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Moderation Scope</h2>
          {moderatorProfile.scope.includes("global") ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
                🌐 Global Moderator
              </span>
              <span className="text-sm text-slate-500">
                Access to all funds and categories
              </span>
            </div>
          ) : scopeFunds && scopeFunds.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600 mb-3">Assigned to the following funds:</p>
              <div className="flex flex-wrap gap-2">
                {scopeFunds.map((fund) => (
                  <Link
                    key={fund.id}
                    href={`/funds/${fund.id}`}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                  >
                    {fund.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No specific scope assigned</p>
          )}
        </div>

        {/* Activity Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Activity Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Average actions per month</span>
              <span className="font-medium text-slate-900">
                {tenureMonths > 0
                  ? Math.round(moderatorProfile.actionsCount / Math.max(tenureMonths + tenureYears * 12, 1))
                  : moderatorProfile.actionsCount}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Flag resolution rate</span>
              <span className="font-medium text-emerald-600">
                {moderatorProfile.actionsCount > 0
                  ? Math.round((moderatorProfile.flagsResolved / moderatorProfile.actionsCount) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-600">Warning ratio</span>
              <span className="font-medium text-amber-600">
                {moderatorProfile.reportsHandled > 0
                  ? Math.round((moderatorProfile.warningsIssued / moderatorProfile.reportsHandled) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
