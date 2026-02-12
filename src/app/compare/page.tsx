import Link from "next/link";
import prisma from "../../lib/prisma";
import { chatCompletion, generateEmbedding } from "../../lib/ai";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ a?: string; b?: string }>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function generateComparison(
  projectA: { title: string; description: string; problem?: string | null; solution?: string | null },
  projectB: { title: string; description: string; problem?: string | null; solution?: string | null }
): Promise<{ summary: string; similarities: string[]; differences: string[]; overlapScore: number }> {
  const textA = [projectA.title, projectA.description, projectA.problem, projectA.solution].filter(Boolean).join("\n\n");
  const textB = [projectB.title, projectB.description, projectB.problem, projectB.solution].filter(Boolean).join("\n\n");

  // Calculate similarity using embeddings
  const [embeddingA, embeddingB] = await Promise.all([
    generateEmbedding(textA),
    generateEmbedding(textB),
  ]);

  const overlapScore = cosineSimilarity(embeddingA.embedding, embeddingB.embedding);

  // Generate comparison using LLM
  const prompt = `Compare these two Cardano Catalyst proposals:

PROPOSAL A: "${projectA.title}"
${projectA.description}
${projectA.problem ? `Problem: ${projectA.problem}` : ""}
${projectA.solution ? `Solution: ${projectA.solution}` : ""}

PROPOSAL B: "${projectB.title}"
${projectB.description}
${projectB.problem ? `Problem: ${projectB.problem}` : ""}
${projectB.solution ? `Solution: ${projectB.solution}` : ""}

Provide a JSON response with:
1. "summary": A brief 2-3 sentence comparison summary
2. "similarities": Array of 3-5 key similarities
3. "differences": Array of 3-5 key differences

Respond ONLY with valid JSON, no markdown.`;

  try {
    const response = await chatCompletion([
      { role: "system", content: "You are an expert analyst comparing blockchain project proposals. Always respond with valid JSON only." },
      { role: "user", content: prompt },
    ]);

    const parsed = JSON.parse(response.content);
    return {
      summary: parsed.summary || "Comparison generated.",
      similarities: parsed.similarities || [],
      differences: parsed.differences || [],
      overlapScore,
    };
  } catch {
    // Fallback if AI fails
    return {
      summary: `These proposals have a semantic similarity score of ${(overlapScore * 100).toFixed(1)}%.`,
      similarities: overlapScore > 0.7 ? ["Both address similar problem domains", "Comparable scope and approach"] : [],
      differences: ["Different primary focus areas", "Varying implementation approaches"],
      overlapScore,
    };
  }
}

export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const projectAId = params.a;
  const projectBId = params.b;

  const recentProjects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      fund: { select: { name: true } },
    },
  });

  let projectA = null;
  let projectB = null;
  let comparison = null;

  if (projectAId) {
    projectA = await prisma.project.findUnique({
      where: { id: projectAId },
      select: {
        id: true,
        title: true,
        description: true,
        problem: true,
        solution: true,
        category: true,
        fundingAmount: true,
        fund: { select: { name: true } },
      },
    });
  }

  if (projectBId) {
    projectB = await prisma.project.findUnique({
      where: { id: projectBId },
      select: {
        id: true,
        title: true,
        description: true,
        problem: true,
        solution: true,
        category: true,
        fundingAmount: true,
        fund: { select: { name: true } },
      },
    });
  }

  if (projectA && projectB) {
    comparison = await generateComparison(projectA, projectB);
  }

  const getOverlapColor = (score: number) => {
    if (score >= 0.8) return "text-red-600 bg-red-50";
    if (score >= 0.6) return "text-amber-600 bg-amber-50";
    return "text-emerald-600 bg-emerald-50";
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">AI Proposal Comparison</h1>
          <p className="mt-2 text-sm text-slate-600">
            Compare two proposals side-by-side with AI-powered analysis.
          </p>
        </header>

        {/* Project Selectors */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Project A Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Proposal A</h2>
            {projectA ? (
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="font-medium text-blue-900">{projectA.title}</p>
                <p className="mt-1 text-sm text-blue-700">{projectA.fund.name}</p>
                <Link
                  href={`/compare?b=${projectBId || ""}`}
                  className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                >
                  Change
                </Link>
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/compare?a=${p.id}&b=${projectBId || ""}`}
                    className="block rounded-lg bg-slate-50 p-3 hover:bg-slate-100 transition"
                  >
                    <p className="font-medium text-slate-900 text-sm truncate">{p.title}</p>
                    <p className="text-xs text-slate-500">{p.fund.name}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Project B Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Proposal B</h2>
            {projectB ? (
              <div className="rounded-lg bg-purple-50 p-4">
                <p className="font-medium text-purple-900">{projectB.title}</p>
                <p className="mt-1 text-sm text-purple-700">{projectB.fund.name}</p>
                <Link
                  href={`/compare?a=${projectAId || ""}`}
                  className="mt-2 inline-block text-xs text-purple-600 hover:underline"
                >
                  Change
                </Link>
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {recentProjects
                  .filter((p) => p.id !== projectAId)
                  .map((p) => (
                    <Link
                      key={p.id}
                      href={`/compare?a=${projectAId || ""}&b=${p.id}`}
                      className="block rounded-lg bg-slate-50 p-3 hover:bg-slate-100 transition"
                    >
                      <p className="font-medium text-slate-900 text-sm truncate">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.fund.name}</p>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Comparison Results */}
        {comparison && projectA && projectB && (
          <div className="space-y-6">
            {/* Overlap Score */}
            <div className={`rounded-2xl p-6 ${getOverlapColor(comparison.overlapScore)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Semantic Overlap</h3>
                  <p className="mt-1 text-sm opacity-80">
                    Based on embedding similarity analysis
                  </p>
                </div>
                <div className="text-4xl font-bold">
                  {(comparison.overlapScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Summary</h3>
              <p className="text-slate-700">{comparison.summary}</p>
            </div>

            {/* Similarities & Differences */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Similarities */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-emerald-900">Similarities</h3>
                {comparison.similarities.length > 0 ? (
                  <ul className="space-y-2">
                    {comparison.similarities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-emerald-800">
                        <span className="mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-emerald-700">No significant similarities detected.</p>
                )}
              </div>

              {/* Differences */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-blue-900">Differences</h3>
                {comparison.differences.length > 0 ? (
                  <ul className="space-y-2">
                    {comparison.differences.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                        <span className="mt-0.5">◆</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-blue-700">No significant differences detected.</p>
                )}
              </div>
            </div>

            {/* Side-by-side Details */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
                <h3 className="font-semibold text-slate-900">Side-by-Side Details</h3>
              </div>
              <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* Project A Details */}
                <div className="p-6">
                  <h4 className="font-medium text-blue-800 mb-3">{projectA.title}</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-500">Category:</span>
                      <span className="ml-2 text-slate-700">{projectA.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Funding:</span>
                      <span className="ml-2 text-slate-700">
                        {Number(projectA.fundingAmount).toLocaleString()} ADA
                      </span>
                    </div>
                    {projectA.problem && (
                      <div>
                        <span className="text-slate-500 block mb-1">Problem:</span>
                        <p className="text-slate-700 text-xs">{projectA.problem.slice(0, 200)}...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project B Details */}
                <div className="p-6">
                  <h4 className="font-medium text-purple-800 mb-3">{projectB.title}</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-500">Category:</span>
                      <span className="ml-2 text-slate-700">{projectB.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Funding:</span>
                      <span className="ml-2 text-slate-700">
                        {Number(projectB.fundingAmount).toLocaleString()} ADA
                      </span>
                    </div>
                    {projectB.problem && (
                      <div>
                        <span className="text-slate-500 block mb-1">Problem:</span>
                        <p className="text-slate-700 text-xs">{projectB.problem.slice(0, 200)}...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* View Projects Links */}
            <div className="flex gap-4">
              <Link
                href={`/projects/${projectA.id}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View Proposal A
              </Link>
              <Link
                href={`/projects/${projectB.id}`}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                View Proposal B
              </Link>
            </div>
          </div>
        )}

        {/* No Comparison Yet */}
        {(!projectA || !projectB) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">
              Select two proposals above to generate an AI-powered comparison.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
