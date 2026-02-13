import Link from "next/link";
import { cookies } from "next/headers";
import prisma from "../../lib/prisma";

export const revalidate = 0;

const formatCurrency = (amount: unknown) => {
  const num = Number(amount);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toLocaleString();
};

export default async function BookmarksPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  // If no user, show empty state
  if (!userId) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">My Bookmarks</h1>
          </header>
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="text-4xl mb-4">🔖</div>
            <h2 className="text-lg font-semibold text-slate-900">Sign in to save bookmarks</h2>
            <p className="mt-2 text-sm text-slate-600">
              Connect your wallet to save and manage proposal bookmarks.
            </p>
            <Link
              href="/discover"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Discover Proposals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch user's bookmarks and lists
  const [bookmarks, lists] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            fundingAmount: true,
            status: true,
            fund: { select: { name: true } },
          },
        },
        list: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.bookmarkList.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { bookmarks: true } },
      },
    }),
  ]);

  const likedBookmarks = bookmarks.filter((b) => b.action === "like");
  const savedBookmarks = bookmarks.filter((b) => b.action === "save");

  // Generate CSV export URL
  const csvData = bookmarks
    .map((b) => ({
      title: b.project.title,
      category: b.project.category,
      funding: Number(b.project.fundingAmount),
      status: b.project.status,
      fund: b.project.fund.name,
      action: b.action,
      list: b.list?.name || "",
      savedAt: b.createdAt.toISOString(),
    }));

  const csvContent = [
    ["Title", "Category", "Funding", "Status", "Fund", "Action", "List", "Saved At"].join(","),
    ...csvData.map((row) => 
      [
        `"${row.title.replace(/"/g, '""')}"`,
        row.category,
        row.funding,
        row.status,
        row.fund,
        row.action,
        row.list,
        row.savedAt,
      ].join(",")
    ),
  ].join("\n");

  const csvBase64 = Buffer.from(csvContent).toString("base64");

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Bookmarks</h1>
            <p className="mt-2 text-sm text-slate-600">
              {bookmarks.length} saved proposals
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href={`data:text/csv;base64,${csvBase64}`}
              download="bookmarks.csv"
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
            >
              Export CSV
            </a>
            <Link
              href="/discover"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Discover More
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Lists */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Lists</h2>
              <div className="space-y-2">
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">All Liked</span>
                    <span className="text-sm text-blue-600">{likedBookmarks.length}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-emerald-900">Saved</span>
                    <span className="text-sm text-emerald-600">{savedBookmarks.length}</span>
                  </div>
                </div>
                {lists.map((list) => (
                  <div key={list.id} className="rounded-lg bg-slate-50 p-3 hover:bg-slate-100 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{list.name}</span>
                      <span className="text-sm text-slate-500">{list._count.bookmarks}</span>
                    </div>
                    {list.isPublic && (
                      <span className="mt-1 inline-block text-xs text-slate-400">Public</span>
                    )}
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-600">
                + Create List
              </button>
            </div>
          </div>

          {/* Main - Bookmarks */}
          <div className="lg:col-span-3">
            {bookmarks.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <div className="text-4xl mb-4">📚</div>
                <h2 className="text-lg font-semibold text-slate-900">No bookmarks yet</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Start discovering proposals and save the ones you like!
                </p>
                <Link
                  href="/discover"
                  className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Discover Proposals
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              bookmark.action === "like"
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {bookmark.action === "like" ? "♥ Liked" : "📌 Saved"}
                          </span>
                          {bookmark.list && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {bookmark.list.name}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/projects/${bookmark.project.id}`}
                          className="mt-2 block font-semibold text-slate-900 hover:text-blue-600"
                        >
                          {bookmark.project.title}
                        </Link>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {bookmark.project.description}
                        </p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                          <span>{bookmark.project.fund.name}</span>
                          <span>•</span>
                          <span>{bookmark.project.category}</span>
                          <span>•</span>
                          <span>{formatCurrency(bookmark.project.fundingAmount)} ADA</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                            bookmark.project.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : bookmark.project.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {bookmark.project.status}
                        </span>
                        <p className="mt-2 text-xs text-slate-400">
                          {bookmark.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {bookmark.notes && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        {bookmark.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
