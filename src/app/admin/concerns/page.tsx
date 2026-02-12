import prisma from "../../../lib/prisma";

export default async function ConcernsQueuePage() {
  const concerns = await prisma.concern.findMany({
    where: { status: "pending" },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Moderation Queue</h1>
          <p className="mt-2 text-base text-slate-600">
            Pending concerns awaiting review.
          </p>
        </header>

        {concerns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
            No pending concerns.
          </div>
        ) : (
          <div className="space-y-4">
            {concerns.map((concern) => (
              <div
                key={concern.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {concern.project.title}
                    </p>
                    <p className="text-xs text-slate-500">{concern.category}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    Pending
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  {concern.description}
                </p>
                {concern.evidenceUrl && (
                  <a
                    href={concern.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                  >
                    View evidence
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
