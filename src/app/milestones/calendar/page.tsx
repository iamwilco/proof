import Link from "next/link";
import prisma from "../../../lib/prisma";
import CalendarFilters from "./CalendarFilters";

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ fund?: string; status?: string; month?: string; year?: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function MilestoneCalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const selectedYear = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const selectedMonth = params.month ? parseInt(params.month, 10) - 1 : now.getMonth();
  const fundFilter = params.fund ?? "";
  const statusFilter = params.status ?? "";

  const startOfMonth = new Date(selectedYear, selectedMonth, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

  const where: Record<string, unknown> = {
    dueDate: {
      gte: startOfMonth,
      lte: endOfMonth,
    },
  };
  if (statusFilter) {
    where.status = statusFilter;
  }
  if (fundFilter) {
    where.project = { fundId: fundFilter };
  }

  const [milestones, funds] = await Promise.all([
    prisma.milestone.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            fund: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.fund.findMany({
      where: { number: { gt: 0 } },
      select: { id: true, name: true, number: true },
      orderBy: { number: "desc" },
    }),
  ]);

  const milestonesByDay = new Map<number, typeof milestones>();
  for (const milestone of milestones) {
    if (milestone.dueDate) {
      const day = milestone.dueDate.getDate();
      const existing = milestonesByDay.get(day) ?? [];
      existing.push(milestone);
      milestonesByDay.set(day, existing);
    }
  }

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = selectedMonth === 0 ? 12 : selectedMonth;
  const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const nextMonth = selectedMonth === 11 ? 1 : selectedMonth + 2;
  const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    if (overrides.year !== undefined) {
      newParams.set("year", overrides.year);
    } else {
      newParams.set("year", String(selectedYear));
    }
    if (overrides.month !== undefined) {
      newParams.set("month", overrides.month);
    } else {
      newParams.set("month", String(selectedMonth + 1));
    }
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

  const icalUrl = `/api/milestones/ical?year=${selectedYear}&month=${selectedMonth + 1}${
    fundFilter ? `&fund=${fundFilter}` : ""
  }${statusFilter ? `&status=${statusFilter}` : ""}`;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Milestone Calendar</h1>
            <p className="mt-2 text-sm text-slate-600">
              View upcoming and overdue milestone deadlines.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/milestones"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              List View
            </Link>
            <a
              href={icalUrl}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Export iCal
            </a>
          </div>
        </header>

        {/* Filters */}
        <CalendarFilters
          funds={funds}
          fundFilter={fundFilter}
          statusFilter={statusFilter}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />

        {/* Month Navigation */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
          <Link
            href={buildUrl({ year: String(prevYear), month: String(prevMonth) })}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Previous
          </Link>
          <h2 className="text-xl font-semibold text-slate-900">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </h2>
          <Link
            href={buildUrl({ year: String(nextYear), month: String(nextMonth) })}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Next →
          </Link>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {emptyDays.map((i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-slate-100 bg-slate-50/50" />
            ))}
            {days.map((day) => {
              const dayMilestones = milestonesByDay.get(day) ?? [];
              const isToday =
                day === now.getDate() &&
                selectedMonth === now.getMonth() &&
                selectedYear === now.getFullYear();
              const hasOverdue = dayMilestones.some((m) => m.status === "overdue" || (m.dueDate && m.dueDate < now && m.status !== "completed"));

              return (
                <div
                  key={day}
                  className={`min-h-[100px] border-b border-r border-slate-100 p-2 ${
                    isToday ? "bg-blue-50/50" : ""
                  } ${hasOverdue ? "bg-red-50/30" : ""}`}
                >
                  <div className={`mb-1 text-sm font-medium ${isToday ? "text-blue-600" : "text-slate-700"}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayMilestones.slice(0, 3).map((milestone) => (
                      <Link
                        key={milestone.id}
                        href={`/projects/${milestone.project.id}`}
                        className={`block truncate rounded border px-1.5 py-0.5 text-xs ${
                          STATUS_COLORS[milestone.status] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                        title={`${milestone.title} - ${milestone.project.title}`}
                      >
                        {milestone.title}
                      </Link>
                    ))}
                    {dayMilestones.length > 3 && (
                      <div className="text-xs text-slate-500">
                        +{dayMilestones.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-slate-500">Status:</span>
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <span key={status} className={`rounded border px-2 py-0.5 ${colors}`}>
              {status.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
