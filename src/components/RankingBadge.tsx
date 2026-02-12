type RankingBadgeProps = {
  rank: number;
  label?: string;
  size?: "sm" | "md";
};

export default function RankingBadge({ rank, label, size = "md" }: RankingBadgeProps) {
  const isTop3 = rank <= 3;
  const isTop10 = rank <= 10;

  const medals: Record<number, string> = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
  };

  const colorClasses = isTop3
    ? "bg-amber-100 text-amber-800 border-amber-200"
    : isTop10
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : "bg-slate-50 text-slate-600 border-slate-100";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} ${colorClasses}`}
      title={label ? `${label}: #${rank}` : `Rank #${rank}`}
    >
      {isTop3 && <span>{medals[rank]}</span>}
      <span>#{rank}</span>
      {label && size === "md" && (
        <span className="text-xs font-normal opacity-70">{label}</span>
      )}
    </span>
  );
}
