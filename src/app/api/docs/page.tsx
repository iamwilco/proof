import Link from "next/link";

const endpoints = [
  {
    method: "GET",
    path: "/api/projects",
    description: "List projects with pagination and filters",
    params: ["fund", "status", "category", "page", "limit"],
  },
  {
    method: "GET",
    path: "/api/projects/{id}",
    description: "Get project details by ID",
    params: ["id"],
  },
  {
    method: "GET",
    path: "/api/funds",
    description: "List all funds",
    params: [],
  },
  {
    method: "GET",
    path: "/api/funds/{id}",
    description: "Get fund details by ID",
    params: ["id"],
  },
  {
    method: "GET",
    path: "/api/people",
    description: "List proposers with search",
    params: ["search", "page", "limit"],
  },
  {
    method: "GET",
    path: "/api/organizations",
    description: "List organizations",
    params: [],
  },
  {
    method: "GET",
    path: "/api/transactions",
    description: "List funding transactions",
    params: ["project", "fund", "type", "page", "limit"],
  },
  {
    method: "GET",
    path: "/api/analytics/funds/{id}",
    description: "Get fund analytics",
    params: ["id"],
  },
  {
    method: "GET",
    path: "/api/analytics/proposers",
    description: "Get proposer leaderboard",
    params: ["sort", "limit"],
  },
  {
    method: "GET",
    path: "/api/discover",
    description: "Get discovery feed for swipe UI",
    params: [],
  },
  {
    method: "GET",
    path: "/api/search/ai",
    description: "AI-powered natural language search",
    params: ["q", "fund"],
  },
];

const codeExamples = {
  curl: `curl -X GET "https://api.example.com/api/projects?status=completed&limit=10" \\
  -H "Accept: application/json"`,
  javascript: `fetch('/api/projects?status=completed&limit=10')
  .then(res => res.json())
  .then(data => console.log(data.projects));`,
  python: `import requests

response = requests.get(
    'https://api.example.com/api/projects',
    params={'status': 'completed', 'limit': 10}
)
projects = response.json()['projects']`,
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-slate-900">API Documentation</h1>
          <p className="mt-2 text-slate-600">
            REST API for accessing Cardano Catalyst transparency data
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/openapi.yaml"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Download OpenAPI Spec
            </Link>
            <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600">
              Version 1.0.0
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Base URL */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Base URL</h2>
          <code className="block rounded-lg bg-slate-800 text-emerald-400 px-4 py-3 text-sm">
            https://your-domain.com/api
          </code>
        </section>

        {/* Authentication */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Authentication</h2>
          <p className="text-slate-600 text-sm mb-4">
            Most endpoints are publicly accessible. Authenticated endpoints require a Bearer token:
          </p>
          <code className="block rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-800">
            Authorization: Bearer &lt;your-jwt-token&gt;
          </code>
        </section>

        {/* Endpoints */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Endpoints</h2>
          <div className="space-y-3">
            {endpoints.map((endpoint, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition"
              >
                <div className="flex items-start gap-3">
                  <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-mono font-bold text-emerald-700">
                    {endpoint.method}
                  </span>
                  <div className="flex-1">
                    <code className="text-sm font-medium text-slate-900">
                      {endpoint.path}
                    </code>
                    <p className="mt-1 text-sm text-slate-600">{endpoint.description}</p>
                    {endpoint.params.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {endpoint.params.map((param) => (
                          <span
                            key={param}
                            className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {param}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Code Examples</h2>
          <div className="space-y-4">
            {Object.entries(codeExamples).map(([lang, code]) => (
              <div key={lang} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
                  <span className="text-sm font-medium text-slate-700 capitalize">{lang}</span>
                </div>
                <pre className="p-4 text-sm text-slate-800 overflow-x-auto">
                  <code>{code}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>

        {/* Response Format */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Response Format</h2>
          <p className="text-slate-600 text-sm mb-4">
            All responses are JSON. List endpoints return paginated results:
          </p>
          <pre className="rounded-lg bg-slate-100 p-4 text-sm text-slate-800 overflow-x-auto">
{`{
  "projects": [...],
  "total": 1234,
  "page": 1,
  "limit": 20
}`}
          </pre>
        </section>

        {/* Rate Limiting */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-2">Rate Limiting</h2>
          <p className="text-amber-800 text-sm">
            API requests are limited to 100 requests per minute per IP address.
            Exceeded limits return HTTP 429 with a Retry-After header.
          </p>
        </section>
      </div>
    </div>
  );
}
