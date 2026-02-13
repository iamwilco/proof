interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-slate-200";
  
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  if (lines > 1 && variant === "text") {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]} h-4 ${className}`}
            style={{
              ...style,
              width: i === lines - 1 ? "75%" : width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height={20} width="60%" />
          <Skeleton variant="text" height={16} width="40%" />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton variant="text" lines={3} />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton variant="rectangular" width={80} height={28} />
        <Skeleton variant="rectangular" width={80} height={28} />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" height={16} width={i === 0 ? "80%" : "60%"} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton variant="text" height={14} width="70%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <Skeleton variant="text" height={14} width="40%" />
      <Skeleton variant="text" height={32} width="60%" className="mt-2" />
      <Skeleton variant="text" height={12} width="50%" className="mt-2" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={64} height={64} />
      <div className="space-y-2">
        <Skeleton variant="text" height={24} width={180} />
        <Skeleton variant="text" height={16} width={120} />
      </div>
    </div>
  );
}
