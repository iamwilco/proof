import Link from "next/link";
import prisma from "../../../lib/prisma";
import { chatCompletion, generateEmbedding, searchSimilar, indexProject } from "../../../lib/ai";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ q?: string; fund?: string }>;
}

async function searchProposals(query: string, fundFilter?: string) {
  // Generate embedding for the query
  const { embedding } = await generateEmbedding(query);

  // Search for similar projects
  const filter = fundFilter ? { type: "project", fundId: fundFilter } : { type: "project" };
  const results = await searchSimilar(embedding, 10, filter);

  if (results.length === 0) {
    // Fallback to database search if vector store is empty
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
        ...(fundFilter ? { fundId: fundFilter } : {}),
      },
      take: 10,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fundingAmount: true,
        status: true,
        fund: { select: { id: true, name: true } },
      },
    });

    return projects.map((p) => ({
      project: p,
      score: 0.5,
      explanation: "Matched by keyword search",
    }));
  }

  // Fetch full project details for results
  const projectIds = results.map((r) => r.id);
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      fundingAmount: true,
      status: true,
      fund: { select: { id: true, name: true } },
    },
  });

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return results
    .map((r) => ({
      project: projectMap.get(r.id),
      score: r.score,
      explanation: `Semantic similarity: ${(r.score * 100).toFixed(0)}%`,
    }))
    .filter((r) => r.project);
}

async function generateAnswer(query: string, projects: Array<{ project: { title: string; description: string }; score: number }>) {
  if (projects.length === 0) {
    return "I couldn't find any proposals matching your query. Try rephrasing or using different keywords.";
  }

  const context = projects
    .slice(0, 5)
    .map((p, i) => `${i + 1}. "${p.project.title}": ${p.project.description.slice(0, 200)}...`)
    .join("\n\n");

  const prompt = `Based on these Cardano Catalyst proposals, answer the user's question.

USER QUESTION: ${query}

RELEVANT PROPOSALS:
${context}

Provide a helpful, concise answer that references the relevant proposals by name. If the question cannot be fully answered from the proposals, acknowledge this.`;

  try {
    const response = await chatCompletion([
      { role: "system", content: "You are a helpful assistant that answers questions about Cardano Catalyst proposals. Be concise and reference specific proposals when relevant." },
      { role: "user", content: prompt },
    ]);

    return response.content;
  } catch {
    return `Found ${projects.length} relevant proposals. The top matches are: ${projects.slice(0, 3).map((p) => `"${p.project.title}"`).join(", ")}.`;
  }
}

export default async function AISearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const fundFilter = params.fund;

  const funds = await prisma.fund.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  let results: Array<{ project: { id: string; title: string; description: string; category: string; fundingAmount: unknown; status: string; fund: { id: string; name: string } }; score: number; explanation: string }> = [];
  let answer = "";

  if (query) {
    results = await searchProposals(query, fundFilter) as typeof results;
    answer = await generateAnswer(query, results as Array<{ project: { title: string; description: string }; score: number }>);
  }

  // Index some projects in the background if vector store is likely empty
  if (query && results.length === 0) {
    const projectsToIndex = await prisma.project.findMany({
      take: 20,
      select: { id: true },
    });
    for (const p of projectsToIndex.slice(0, 5)) {
      try {
        await indexProject(p.id);
      } catch {
        // Ignore indexing errors
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">AI Search</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ask questions about Catalyst proposals in natural language.
          </p>
        </header>

        {/* Search Form */}
        <form method="GET" className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Ask anything about Catalyst proposals..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <select
              name="fund"
              defaultValue={fundFilter || ""}
              className="rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Funds</option>
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Example Queries */}
        {!query && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Try asking:</h2>
            <div className="flex flex-wrap gap-2">
              {[
                "What projects are working on DeFi?",
                "Show me completed education projects",
                "Which proposals focus on Africa?",
                "Find projects building developer tools",
                "What governance solutions exist?",
              ].map((example) => (
                <Link
                  key={example}
                  href={`/search/ai?q=${encodeURIComponent(example)}`}
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 transition"
                >
                  {example}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Answer */}
        {query && answer && (
          <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                AI
              </div>
              <div className="flex-1">
                <p className="text-slate-800 whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {query && (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                {results.length} Relevant Proposals
              </h2>
              {fundFilter && (
                <Link
                  href={`/search/ai?q=${encodeURIComponent(query)}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Clear fund filter
                </Link>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {results.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500">
                  No proposals found. Try a different query.
                </div>
              ) : (
                results.map(({ project, score, explanation }) => (
                  <div
                    key={project.id}
                    className="px-6 py-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600"
                        >
                          {project.title}
                        </Link>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                          <span>{project.fund.name}</span>
                          <span>•</span>
                          <span>{project.category}</span>
                          <span>•</span>
                          <span>{project.status}</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          {(score * 100).toFixed(0)}% match
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{explanation}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Follow-up Suggestions */}
        {query && results.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-medium text-slate-700">Follow-up questions:</h3>
            <div className="flex flex-wrap gap-2">
              {[
                `Compare the top ${Math.min(results.length, 3)} results`,
                `Which of these are completed?`,
                `Show me similar projects to "${results[0]?.project?.title?.slice(0, 30)}..."`,
              ].map((followUp) => (
                <Link
                  key={followUp}
                  href={`/search/ai?q=${encodeURIComponent(followUp)}${fundFilter ? `&fund=${fundFilter}` : ""}`}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 transition"
                >
                  {followUp}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
