import Link from "next/link";
import prisma from "../../lib/prisma";
import { predictProject, getModelAccuracy } from "../../lib/predictiveAnalytics";

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ project?: string }>;
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const getRiskColor = (score: number) => {
  if (score >= 70) return "text-red-600 bg-red-50";
  if (score >= 40) return "text-amber-600 bg-amber-50";
  return "text-emerald-600 bg-emerald-50";
};

const getProbabilityColor = (value: number) => {
  if (value >= 0.7) return "text-emerald-600";
  if (value >= 0.4) return "text-amber-600";
  return "text-red-600";
};

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedProjectId = params.project;

  const recentProjects = await prisma.project.findMany({
    where: { fundingStatus: "funded" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      status: true,
      fund: { select: { name: true } },
    },
  });

  const modelAccuracy = await getModelAccuracy();

  let prediction = null;
  let selectedProject = null;

  if (selectedProjectId) {
    try {
      prediction = await predictProject(selectedProjectId);
      selectedProject = await prisma.project.findUnique({
        where: { id: selectedProjectId },
        select: {
          id: true,
          title: true,
          status: true,
          fundingAmount: true,
          fund: { select: { name: true } },
        },
      });
    } catch (error) {
      console.error("Prediction error:", error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Predictive Analytics</h1>
          <p className="mt-2 text-sm text-slate-600">
            ML-based predictions for proposal success and completion probability.
          </p>
        </header>

        {/* Model Accuracy Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Funding Prediction Accuracy
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {modelAccuracy.fundingAccuracy.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Completion Prediction Accuracy
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {modelAccuracy.completionAccuracy.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Training Sample Size
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {modelAccuracy.sampleSize} projects
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Project Selector */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Select Project
              </h2>
              <div className="space-y-2">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/analytics?project=${project.id}`}
                    className={`block rounded-lg p-3 transition ${
                      selectedProjectId === project.id
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {project.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {project.fund.name} • {project.status}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Prediction Results */}
          <div className="lg:col-span-2">
            {!selectedProjectId ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-slate-500">
                  Select a project to view predictions.
                </p>
              </div>
            ) : !prediction || !selectedProject ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-red-500">
                  Failed to generate prediction for this project.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Project Header */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedProject.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedProject.fund.name} • Status: {selectedProject.status}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-slate-400">Confidence:</span>
                    <div className="h-2 w-24 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {prediction.confidence.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Prediction Scores */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Funding Success
                    </p>
                    <p className={`mt-2 text-3xl font-bold ${getProbabilityColor(prediction.fundingSuccessProbability)}`}>
                      {formatPercent(prediction.fundingSuccessProbability)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">probability</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Completion Probability
                    </p>
                    <p className={`mt-2 text-3xl font-bold ${getProbabilityColor(prediction.completionProbability)}`}>
                      {formatPercent(prediction.completionProbability)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">if funded</p>
                  </div>
                  <div className={`rounded-2xl border p-5 ${getRiskColor(prediction.riskScore)}`}>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                      Risk Score
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                      {prediction.riskScore}/100
                    </p>
                    <p className="mt-1 text-xs opacity-70">
                      {prediction.riskScore >= 70 ? "High Risk" : 
                       prediction.riskScore >= 40 ? "Medium Risk" : "Low Risk"}
                    </p>
                  </div>
                </div>

                {/* Risk Factors */}
                {prediction.riskFactors.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <h3 className="font-semibold text-amber-800">Risk Factors</h3>
                    <ul className="mt-3 space-y-2">
                      {prediction.riskFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                          <span className="mt-0.5">⚠️</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* View Project Link */}
                <div className="flex gap-3">
                  <Link
                    href={`/projects/${selectedProject.id}`}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    View Project Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
