"use client";

import { useRouter } from "next/navigation";

interface CalendarFiltersProps {
  funds: Array<{ id: string; name: string; number: number }>;
  fundFilter: string;
  statusFilter: string;
  selectedYear: number;
  selectedMonth: number;
}

export default function CalendarFilters({
  funds,
  fundFilter,
  statusFilter,
  selectedYear,
  selectedMonth,
}: CalendarFiltersProps) {
  const router = useRouter();

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    newParams.set("year", String(selectedYear));
    newParams.set("month", String(selectedMonth + 1));
    if (overrides.fund !== undefined) {
      if (overrides.fund) newParams.set("fund", overrides.fund);
    } else if (fundFilter) {
      newParams.set("fund", fundFilter);
    }
    if (overrides.status !== undefined) {
      if (overrides.status) newParams.set("status", overrides.status);
    } else if (statusFilter) {
      newParams.set("status", statusFilter);
    }
    return `/milestones/calendar?${newParams.toString()}`;
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-500">Fund:</label>
        <select
          defaultValue={fundFilter}
          onChange={(e) => {
            router.push(buildUrl({ fund: e.target.value || undefined }));
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">All Funds</option>
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-500">Status:</label>
        <select
          defaultValue={statusFilter}
          onChange={(e) => {
            router.push(buildUrl({ status: e.target.value || undefined }));
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
    </div>
  );
}
