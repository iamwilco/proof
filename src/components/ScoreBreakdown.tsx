import Link from "next/link";

const WEIGHTS = {
  completion: 0.35,
  delivery: 0.2,
  community: 0.1,
  efficiency: 0.15,
  communication: 0.15,
};

type ScoreBreakdownProps = {
  completionScore: number;
  deliveryScore: number;
  communityScore: number;
  efficiencyScore: number;
  communicationScore: number;
};

const formatContribution = (score: number, weight: number) =>
  Math.round(score * weight);

export default function ScoreBreakdown({
  completionScore,
  deliveryScore,
  communityScore,
  efficiencyScore,
  communicationScore,
}: ScoreBreakdownProps) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">
        View detailed breakdown
      </summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          {
            label: "Completion",
            score: completionScore,
            weight: WEIGHTS.completion,
            source: "/projects",
          },
          {
            label: "On-time delivery",
            score: deliveryScore,
            weight: WEIGHTS.delivery,
            source: "/milestones",
          },
          {
            label: "Community",
            score: communityScore,
            weight: WEIGHTS.community,
            source: "/reviews",
          },
          {
            label: "Efficiency",
            score: efficiencyScore,
            weight: WEIGHTS.efficiency,
            source: "/reports",
          },
          {
            label: "Communication",
            score: communicationScore,
            weight: WEIGHTS.communication,
            source: "/reports",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <Link href={item.source} className="text-xs text-blue-600 hover:underline">
                Source
              </Link>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-semibold text-slate-900">{item.score}</span>
              <span className="text-xs text-slate-500">{Math.round(item.weight * 100)}% weight</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Contribution: {formatContribution(item.score, item.weight)} pts
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
