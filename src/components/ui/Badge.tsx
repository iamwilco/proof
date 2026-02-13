import { HTMLAttributes, forwardRef } from "react";

export type BadgeVariant = 
  | "default" 
  | "success" 
  | "warning" 
  | "danger" 
  | "info" 
  | "trusted" 
  | "reliable" 
  | "unproven" 
  | "concerning";

export type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  trusted: "bg-emerald-100 text-emerald-700",
  reliable: "bg-sky-100 text-sky-700",
  unproven: "bg-slate-100 text-slate-600",
  concerning: "bg-red-100 text-red-700",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  trusted: "bg-emerald-500",
  reliable: "bg-sky-500",
  unproven: "bg-slate-400",
  concerning: "bg-red-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", dot = false, icon, className = "", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
        {icon}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

interface AccountabilityBadgeProps {
  score: number;
  size?: BadgeSize;
  showScore?: boolean;
}

export function getAccountabilityVariant(score: number): BadgeVariant {
  if (score >= 80) return "trusted";
  if (score >= 60) return "reliable";
  if (score >= 40) return "unproven";
  return "concerning";
}

export function getAccountabilityLabel(score: number): string {
  if (score >= 80) return "Trusted";
  if (score >= 60) return "Reliable";
  if (score >= 40) return "Unproven";
  return "Concerning";
}

export function getAccountabilityIcon(score: number): string {
  if (score >= 80) return "🏆";
  if (score >= 60) return "✅";
  if (score >= 40) return "⚪";
  return "⚠️";
}

export function AccountabilityBadge({ score, size = "md", showScore = true }: AccountabilityBadgeProps) {
  const variant = getAccountabilityVariant(score);
  const label = getAccountabilityLabel(score);
  const icon = getAccountabilityIcon(score);

  return (
    <Badge variant={variant} size={size}>
      <span>{icon}</span>
      <span>{label}</span>
      {showScore && <span className="opacity-75">({score})</span>}
    </Badge>
  );
}
