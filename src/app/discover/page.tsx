"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  fundingAmount: number;
  status: string;
  fund: { name: string };
  primaryPerson: null | {
    id: string;
    name: string;
    completionRate: number;
    accountabilityScore: number | null;
    onTimeDelivery: number | null;
    badge: string | null;
  };
  flagCount: number;
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
};

const FUNDS = [
  { value: "15", label: "Fund 15" },
  { value: "14", label: "Fund 14" },
  { value: "13", label: "Fund 13" },
  { value: "12", label: "Fund 12" },
  { value: "11", label: "Fund 11" },
  { value: "all", label: "All Funds" },
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  DApps: "from-violet-500 to-purple-600",
  "Developer Tools": "from-cyan-500 to-blue-600",
  Governance: "from-amber-500 to-orange-600",
  Education: "from-emerald-500 to-teal-600",
  Infrastructure: "from-rose-500 to-pink-600",
  Community: "from-sky-500 to-indigo-600",
  Startups: "from-fuchsia-500 to-purple-600",
};

const BADGE_STYLES: Record<string, string> = {
  TRUSTED: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
  RELIABLE: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
  UNPROVEN: "bg-slate-500/20 text-slate-300 ring-slate-500/30",
  CONCERNING: "bg-red-500/20 text-red-300 ring-red-500/30",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  complete: { label: "Complete", color: "text-emerald-400" },
  in_progress: { label: "In Progress", color: "text-blue-400" },
  pending: { label: "Pending", color: "text-amber-400" },
  not_started: { label: "Not Started", color: "text-slate-400" },
};

// ─── Swipe card with real drag physics ───────────────────────────
function SwipeCard({
  project,
  active,
  stackIndex,
  onSwipe,
  onTapDetails,
}: {
  project: Project;
  active: boolean;
  stackIndex: number;
  onSwipe: (dir: "left" | "right") => void;
  onTapDetails: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const didMove = useRef(false);
  const [dragState, setDragState] = useState({ x: 0, y: 0, active: false });
  const [flyOut, setFlyOut] = useState<"left" | "right" | null>(null);

  const SWIPE_THRESHOLD = 100;

  const handleStart = (clientX: number, clientY: number) => {
    if (!active) return;
    isDragging.current = true;
    didMove.current = false;
    startPos.current = { x: clientX, y: clientY };
    currentPos.current = { x: 0, y: 0 };
    setDragState({ x: 0, y: 0, active: true });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didMove.current = true;
    currentPos.current = { x: dx, y: dy };
    setDragState({ x: dx, y: dy, active: true });
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const { x } = currentPos.current;

    if (Math.abs(x) > SWIPE_THRESHOLD) {
      const dir = x > 0 ? "right" : "left";
      setFlyOut(dir);
      setTimeout(() => onSwipe(dir), 300);
    } else {
      setDragState({ x: 0, y: 0, active: false });
    }
  };

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
    const onMM = (ev: MouseEvent) => handleMove(ev.clientX, ev.clientY);
    const onMU = () => {
      handleEnd();
      window.removeEventListener("mousemove", onMM);
      window.removeEventListener("mouseup", onMU);
    };
    window.addEventListener("mousemove", onMM);
    window.addEventListener("mouseup", onMU);
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    handleStart(t.clientX, t.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    handleMove(t.clientX, t.clientY);
  };
  const onTouchEnd = () => handleEnd();

  // Compute transform
  const rotation = dragState.active ? dragState.x * 0.08 : 0;
  const likeOpacity = Math.min(Math.max(dragState.x / SWIPE_THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-dragState.x / SWIPE_THRESHOLD, 0), 1);

  let transform: string;
  let opacity = 1;
  let transition = "none";

  if (flyOut) {
    const flyX = flyOut === "right" ? 1500 : -1500;
    const flyR = flyOut === "right" ? 30 : -30;
    transform = `translate(${flyX}px, ${dragState.y}px) rotate(${flyR}deg)`;
    opacity = 0;
    transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
  } else if (dragState.active) {
    transform = `translate(${dragState.x}px, ${dragState.y * 0.3}px) rotate(${rotation}deg)`;
    transition = "none";
  } else if (active) {
    transform = "translate(0, 0) rotate(0deg)";
    transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  } else {
    // Stacked behind
    const scale = 1 - stackIndex * 0.04;
    const yOff = stackIndex * 8;
    transform = `scale(${scale}) translateY(${yOff}px)`;
    transition = "transform 0.3s ease";
    opacity = 1 - stackIndex * 0.15;
  }

  const gradient =
    CATEGORY_GRADIENTS[project.category] || "from-blue-500 to-indigo-600";
  const person = project.primaryPerson;
  const badge = person?.badge;
  const statusInfo = STATUS_LABELS[project.status] || {
    label: project.status,
    color: "text-slate-400",
  };

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 select-none"
      style={{
        zIndex: active ? 20 : 10 - stackIndex,
        transform,
        opacity,
        transition,
        touchAction: "none",
        willChange: "transform",
      }}
      onMouseDown={active ? onMouseDown : undefined}
      onTouchStart={active ? onTouchStart : undefined}
      onTouchMove={active ? onTouchMove : undefined}
      onTouchEnd={active ? onTouchEnd : undefined}
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
        {/* Gradient header */}
        <div
          className={`relative h-28 bg-gradient-to-br ${gradient} flex items-end p-4`}
        >
          {/* LIKE stamp */}
          {active && (
            <div
              className="absolute left-5 top-5 rounded-md border-4 border-emerald-400 px-4 py-1 -rotate-12"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-2xl font-black tracking-wider text-emerald-400">
                LIKE
              </span>
            </div>
          )}
          {/* NOPE stamp */}
          {active && (
            <div
              className="absolute right-5 top-5 rounded-md border-4 border-red-400 px-4 py-1 rotate-12"
              style={{ opacity: nopeOpacity }}
            >
              <span className="text-2xl font-black tracking-wider text-red-400">
                NOPE
              </span>
            </div>
          )}

          <div className="flex w-full items-end justify-between">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {project.category}
            </span>
            <span className="text-xs font-medium text-white/70">
              {project.fund.name}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-col px-5 py-4" style={{ height: "calc(100% - 7rem)" }}>
          {/* Title & flags */}
          <div className="flex items-start gap-2">
            <h2 className="flex-1 text-lg font-bold leading-tight text-slate-900 line-clamp-2 dark:text-white">
              {project.title}
            </h2>
            {project.flagCount > 0 && (
              <span className="shrink-0 mt-0.5 flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 6a3 3 0 013-3h10l-4 4 4 4H6a3 3 0 01-3-3V6z" />
                </svg>
                {project.flagCount}
              </span>
            )}
          </div>

          {/* Proposer row */}
          {person && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-xs font-bold text-slate-600 dark:from-slate-600 dark:to-slate-700 dark:text-slate-300">
                {person.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {person.name}
                </p>
                <div className="flex items-center gap-2">
                  {badge && (
                    <span
                      className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ${
                        BADGE_STYLES[badge] ?? "bg-slate-500/20 text-slate-300 ring-slate-500/30"
                      }`}
                    >
                      {badge.charAt(0) + badge.slice(1).toLowerCase()}
                    </span>
                  )}
                  {person.accountabilityScore !== null && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Score: {person.accountabilityScore}
                    </span>
                  )}
                </div>
              </div>
              {person.completionRate > 0 && (
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {person.completionRate}%
                  </p>
                  <p className="text-[10px] text-slate-400">completion</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <p className="mt-3 flex-1 overflow-hidden text-sm leading-relaxed text-slate-500 line-clamp-4 dark:text-slate-400">
            {project.description}
          </p>

          {/* Stats row */}
          <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-slate-700/50">
            <div className="text-center">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {fmt(project.fundingAmount)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                ADA
              </p>
            </div>
            <div className="text-center">
              <p className={`text-base font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                Status
              </p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {person?.onTimeDelivery != null ? `${person.onTimeDelivery}%` : "—"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                On-time
              </p>
            </div>
          </div>

          {/* Tap for details */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!didMove.current) onTapDetails();
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            See Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail modal (slide-up sheet) ───────────────────────────────
function DetailSheet({
  project,
  open,
  onClose,
}: {
  project: Project | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!project) return null;

  const person = project.primaryPerson;
  const gradient =
    CATEGORY_GRADIENTS[project.category] || "from-blue-500 to-indigo-600";
  const statusInfo = STATUS_LABELS[project.status] || {
    label: project.status,
    color: "text-slate-400",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[90vh] transform overflow-y-auto rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-800 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex justify-center bg-white/80 py-3 backdrop-blur dark:bg-slate-800/80">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header gradient */}
        <div className={`mx-4 rounded-2xl bg-gradient-to-br ${gradient} p-5`}>
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {project.category}
          </span>
          <h2 className="mt-3 text-xl font-bold text-white">{project.title}</h2>
          <p className="mt-1 text-sm text-white/70">{project.fund.name}</p>
        </div>

        <div className="px-5 pb-8 pt-4 space-y-5">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-700/50">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {fmt(project.fundingAmount)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">ADA Requested</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-700/50">
              <p className={`text-lg font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-700/50">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {project.flagCount}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Flags</p>
            </div>
          </div>

          {/* Proposer */}
          {person && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Proposer
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-lg font-bold text-slate-600 dark:from-slate-600 dark:to-slate-700 dark:text-slate-300">
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/people/${person.id}`}
                    className="text-base font-semibold text-slate-900 hover:underline dark:text-white"
                    onClick={onClose}
                  >
                    {person.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2">
                    {person.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${
                          BADGE_STYLES[person.badge] ?? "bg-slate-500/20 text-slate-300 ring-slate-500/30"
                        }`}
                      >
                        {person.badge.charAt(0) + person.badge.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {person.accountabilityScore ?? "—"}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Score</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {person.completionRate}%
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Completion</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {person.onTimeDelivery != null ? `${person.onTimeDelivery}%` : "—"}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">On-time</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Description
            </p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {project.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={`/projects/${project.id}`}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              onClick={onClose}
            >
              Full Proposal Page
            </Link>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main page ───────────────────────────────────────────────────
export default function DiscoverPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ liked: 0, skipped: 0 });
  const [selectedFund, setSelectedFund] = useState("15");
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const res = await fetch(`/api/discover?fund=${selectedFund}`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
          setCurrentIndex(0);
          setStats({ liked: 0, skipped: 0 });
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [selectedFund]);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating || currentIndex >= projects.length) return;
      setIsAnimating(true);

      setStats((prev) => ({
        liked: direction === "right" ? prev.liked + 1 : prev.liked,
        skipped: direction === "left" ? prev.skipped + 1 : prev.skipped,
      }));

      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => setIsAnimating(false), 350);
    },
    [currentIndex, projects.length, isAnimating]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (detailProject) return; // don't swipe when modal open
      if (e.key === "ArrowLeft" || e.key === "j") handleSwipe("left");
      else if (e.key === "ArrowRight" || e.key === "k" || e.key === " ") {
        e.preventDefault();
        handleSwipe("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwipe, detailProject]);

  const isFinished = currentIndex >= projects.length && projects.length > 0;
  const progress =
    projects.length > 0 ? (currentIndex / projects.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
          <p className="text-sm text-slate-400">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <h1 className="text-lg font-bold text-white">Discover</h1>
        </div>
        <select
          value={selectedFund}
          onChange={(e) => setSelectedFund(e.target.value)}
          className="rounded-full border-0 bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {FUNDS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </header>

      {/* Progress bar */}
      <div className="mx-5 mt-2 h-1 overflow-hidden rounded-full bg-slate-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats chips */}
      <div className="flex items-center justify-center gap-4 py-3">
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1">
          <svg className="h-3.5 w-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="text-xs font-bold text-emerald-400">{stats.liked}</span>
        </div>
        <span className="text-xs text-slate-500">
          {Math.max(0, projects.length - currentIndex)} left
        </span>
        <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1">
          <svg className="h-3.5 w-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-xs font-bold text-red-400">{stats.skipped}</span>
        </div>
      </div>

      {/* Card area */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="relative h-[520px] w-full max-w-[380px]">
          {isFinished ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/50 text-center backdrop-blur">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600">
                <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">All done!</h2>
              <p className="mt-2 text-sm text-slate-400">
                You reviewed {stats.liked + stats.skipped} proposals
              </p>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-emerald-400">{stats.liked} liked</span>
                <span className="text-slate-500">|</span>
                <span className="text-red-400">{stats.skipped} skipped</span>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setCurrentIndex(0);
                    setStats({ liked: 0, skipped: 0 });
                  }}
                  className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-rose-500/25"
                >
                  Start Over
                </button>
                <Link
                  href="/"
                  className="rounded-full bg-slate-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-600"
                >
                  Home
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Render visible stack (up to 3 cards) */}
              {projects
                .slice(currentIndex, currentIndex + 3)
                .map((project, idx) => (
                  <SwipeCard
                    key={project.id}
                    project={project}
                    active={idx === 0}
                    stackIndex={idx}
                    onSwipe={handleSwipe}
                    onTapDetails={() => setDetailProject(project)}
                  />
                ))
                .reverse()}
            </>
          )}
        </div>
      </div>

      {/* Bottom action buttons */}
      {!isFinished && (
        <div className="flex items-center justify-center gap-5 pb-8 pt-4">
          {/* Nope */}
          <button
            onClick={() => handleSwipe("left")}
            className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/30 bg-slate-800 shadow-lg transition-all hover:border-red-500 hover:bg-red-500/10 hover:shadow-red-500/20 active:scale-90"
          >
            <svg className="h-7 w-7 text-red-500 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Info / details */}
          <button
            onClick={() => {
              const p = projects[currentIndex];
              if (p) setDetailProject(p);
            }}
            className="group flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-500/30 bg-slate-800 shadow-lg transition-all hover:border-blue-500 hover:bg-blue-500/10 hover:shadow-blue-500/20 active:scale-90"
          >
            <svg className="h-5 w-5 text-blue-400 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Like */}
          <button
            onClick={() => handleSwipe("right")}
            className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-slate-800 shadow-lg transition-all hover:border-emerald-500 hover:bg-emerald-500/10 hover:shadow-emerald-500/20 active:scale-90"
          >
            <svg className="h-7 w-7 text-emerald-500 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      )}

      {/* Keyboard hint - desktop only */}
      <div className="hidden pb-4 text-center text-[11px] text-slate-600 lg:block">
        <kbd className="rounded bg-slate-700/50 px-1.5 py-0.5 text-slate-400">←</kbd>
        <span className="mx-1.5">Nope</span>
        <kbd className="rounded bg-slate-700/50 px-1.5 py-0.5 text-slate-400">→</kbd>
        <span className="mx-1.5">Like</span>
        <kbd className="rounded bg-slate-700/50 px-1.5 py-0.5 text-slate-400">Space</kbd>
        <span className="ml-1.5">Like</span>
      </div>

      {/* Detail modal */}
      <DetailSheet
        project={detailProject}
        open={!!detailProject}
        onClose={() => setDetailProject(null)}
      />
    </div>
  );
}
