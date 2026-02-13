"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  fundingAmount: number;
  status: string;
  fund: { name: string };
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString();
};

export default function DiscoverPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [stats, setStats] = useState({ liked: 0, skipped: 0 });

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/discover");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (currentIndex >= projects.length) return;

      setSwipeDirection(direction);

      // Update stats
      setStats((prev) => ({
        liked: direction === "right" ? prev.liked + 1 : prev.liked,
        skipped: direction === "left" ? prev.skipped + 1 : prev.skipped,
      }));

      // Track interaction (would call API in production)
      const action = direction === "right" ? "like" : "skip";
      console.log(`${action}: ${projects[currentIndex].id}`);

      // Move to next card after animation
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setSwipeDirection(null);
      }, 300);
    },
    [currentIndex, projects]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "j") {
        handleSwipe("left");
      } else if (e.key === "ArrowRight" || e.key === "k") {
        handleSwipe("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwipe]);

  const currentProject = projects[currentIndex];
  const isFinished = currentIndex >= projects.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-lg">Loading proposals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Discover</h1>
          <p className="mt-1 text-sm text-slate-400">
            Swipe right to bookmark, left to skip
          </p>
        </header>

        {/* Stats */}
        <div className="mb-6 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.liked}</p>
            <p className="text-xs text-slate-500">Liked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{stats.skipped}</p>
            <p className="text-xs text-slate-500">Skipped</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-300">
              {Math.max(0, projects.length - currentIndex)}
            </p>
            <p className="text-xs text-slate-500">Remaining</p>
          </div>
        </div>

        {/* Card Stack */}
        <div className="relative h-[500px]">
          {isFinished ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-slate-800 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold text-white">All caught up!</h2>
              <p className="mt-2 text-slate-400">
                You&apos;ve reviewed all available proposals.
              </p>
              <div className="mt-6 flex gap-4">
                <Link
                  href="/recommendations"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  View Recommendations
                </Link>
                <button
                  onClick={() => {
                    setCurrentIndex(0);
                    setStats({ liked: 0, skipped: 0 });
                  }}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                >
                  Start Over
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Background cards */}
              {projects.slice(currentIndex + 1, currentIndex + 3).map((project, idx) => (
                <div
                  key={project.id}
                  className="absolute inset-0 rounded-3xl bg-white shadow-xl"
                  style={{
                    transform: `scale(${1 - (idx + 1) * 0.05}) translateY(${(idx + 1) * 10}px)`,
                    zIndex: 10 - idx,
                    opacity: 1 - (idx + 1) * 0.2,
                  }}
                />
              ))}

              {/* Current card */}
              {currentProject && (
                <div
                  className={`absolute inset-0 rounded-3xl bg-white shadow-2xl transition-transform duration-300 ${
                    swipeDirection === "left"
                      ? "-translate-x-full -rotate-12 opacity-0"
                      : swipeDirection === "right"
                      ? "translate-x-full rotate-12 opacity-0"
                      : ""
                  }`}
                  style={{ zIndex: 20 }}
                >
                  <div className="flex h-full flex-col p-6">
                    {/* Category Badge */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {currentProject.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {currentProject.fund.name}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="mt-4 text-xl font-bold text-slate-900 line-clamp-2">
                      {currentProject.title}
                    </h2>

                    {/* Description */}
                    <p className="mt-3 flex-1 overflow-y-auto text-sm text-slate-600 line-clamp-6">
                      {currentProject.description}
                    </p>

                    {/* Stats */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-400">Funding</p>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(currentProject.fundingAmount)} ADA
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Status</p>
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            currentProject.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : currentProject.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {currentProject.status}
                        </span>
                      </div>
                    </div>

                    {/* View Details Link */}
                    <Link
                      href={`/projects/${currentProject.id}`}
                      className="mt-4 block text-center text-sm text-blue-600 hover:underline"
                    >
                      View full details →
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        {!isFinished && (
          <div className="mt-6 flex justify-center gap-6">
            <button
              onClick={() => handleSwipe("left")}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-2xl text-white shadow-lg hover:bg-red-600 transition active:scale-95"
              title="Skip (← or J)"
            >
              ✕
            </button>
            <button
              onClick={() => handleSwipe("right")}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white shadow-lg hover:bg-emerald-600 transition active:scale-95"
              title="Like (→ or K)"
            >
              ♥
            </button>
          </div>
        )}

        {/* Keyboard Hints */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <span className="rounded bg-slate-700 px-2 py-1 text-slate-300">←</span>
          <span className="mx-2">Skip</span>
          <span className="rounded bg-slate-700 px-2 py-1 text-slate-300">→</span>
          <span className="mx-2">Like</span>
        </div>
      </div>
    </div>
  );
}
