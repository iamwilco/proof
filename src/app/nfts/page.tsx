import Link from "next/link";
import prisma from "../../lib/prisma";
import { getNFTStats } from "../../lib/nft";

export const revalidate = 60;

const getStatusColor = (status: string) => {
  switch (status) {
    case "minted":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "minting":
      return "bg-blue-100 text-blue-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getVerificationColor = (status: string) => {
  switch (status) {
    case "verified":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const formatDate = (date: Date | null) => {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default async function NFTsPage() {
  const stats = await getNFTStats();

  const nfts = await prisma.completionNFT.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          status: true,
          fund: { select: { name: true } },
        },
      },
    },
    take: 50,
  });

  const completedProjects = await prisma.project.findMany({
    where: {
      status: "completed",
      completionNFT: null,
    },
    select: {
      id: true,
      title: true,
      fund: { select: { name: true } },
    },
    take: 10,
  });

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Completion NFTs</h1>
          <p className="mt-2 text-sm text-slate-600">
            On-chain proof of project completion for Catalyst proposals.
          </p>
        </header>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total NFTs
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Minted
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.minted}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Pending
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Verified
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{stats.verified}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Eligible Projects */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Eligible for NFT
              </h2>
              {completedProjects.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No completed projects without NFTs.
                </p>
              ) : (
                <div className="space-y-3">
                  {completedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-lg bg-slate-50 p-3"
                    >
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 text-sm"
                      >
                        {project.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {project.fund.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* NFT List */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
                <h2 className="font-semibold text-slate-900">NFT Records</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {nfts.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-500">
                    No NFTs created yet.
                  </div>
                ) : (
                  nfts.map((nft) => (
                    <div
                      key={nft.id}
                      className="px-6 py-4 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/projects/${nft.project.id}`}
                            className="font-medium text-slate-900 hover:text-blue-600"
                          >
                            {nft.project.title}
                          </Link>
                          <p className="mt-1 text-xs text-slate-500">
                            {nft.project.fund.name}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                              nft.mintStatus
                            )}`}
                          >
                            {nft.mintStatus}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getVerificationColor(
                              nft.verificationStatus
                            )}`}
                          >
                            {nft.verificationStatus}
                          </span>
                        </div>
                      </div>

                      {/* NFT Details */}
                      <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400">Policy ID:</span>
                          <p className="font-mono text-slate-600 truncate">
                            {nft.policyId || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Minted:</span>
                          <p className="text-slate-600">{formatDate(nft.mintedAt)}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Proposer Wallet:</span>
                          <p className="font-mono text-slate-600 truncate">
                            {nft.proposerWallet || "Not linked"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Wallet Verified:</span>
                          <p className="text-slate-600">
                            {nft.walletVerified ? "✓ Yes" : "✗ No"}
                          </p>
                        </div>
                      </div>

                      {/* Transaction Link */}
                      {nft.mintTxHash && (
                        <div className="mt-3">
                          <a
                            href={`https://cardanoscan.io/transaction/${nft.mintTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View on Cardanoscan →
                          </a>
                        </div>
                      )}

                      {/* Error Message */}
                      {nft.mintError && (
                        <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-600">
                          Error: {nft.mintError}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
