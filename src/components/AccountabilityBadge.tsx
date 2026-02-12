type BadgeTone = "trusted" | "reliable" | "unproven" | "concerning";

type AccountabilityBadgeProps = {
  badge: BadgeTone;
  score: number;
  breakdown?: {
    completionScore?: number;
    deliveryScore?: number;
    communityScore?: number;
    efficiencyScore?: number;
    communicationScore?: number;
  };
  size?: "sm" | "md";
};

const badgeStyles: Record<BadgeTone, string> = {
  trusted: "bg-emerald-100 text-emerald-700",
  reliable: "bg-blue-100 text-blue-700",
  unproven: "bg-amber-100 text-amber-700",
  concerning: "bg-rose-100 text-rose-700",
};

const badgeLabel: Record<BadgeTone, string> = {
  trusted: "Trusted",
  reliable: "Reliable",
  unproven: "Unproven",
  concerning: "Concerning",
};

const formatBreakdown = (breakdown?: AccountabilityBadgeProps["breakdown"]) => {
  if (!breakdown) return undefined;
  return [
    `Completion: ${breakdown.completionScore ?? 0}`,
    `On-time: ${breakdown.deliveryScore ?? 0}`,
    `Community: ${breakdown.communityScore ?? 0}`,
    `Efficiency: ${breakdown.efficiencyScore ?? 0}`,
    `Communication: ${breakdown.communicationScore ?? 0}`,
  ].join("\n");
};

export default function AccountabilityBadge({
  badge,
  score,
  breakdown,
  size = "md",
}: AccountabilityBadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const title = formatBreakdown(breakdown);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold ${sizeClass} ${badgeStyles[badge]}`}
      title={title}
    >
      <span>{badgeLabel[badge]}</span>
      <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-700">
        {score}
      </span>
    </span>
  );
}
