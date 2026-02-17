"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui";

interface SearchResult {
  id: string;
  type: "project" | "person" | "organization" | "fund";
  title: string;
  subtitle?: string;
  href: string;
}

type GlobalSearchProps = {
  className?: string;
  overlay?: boolean;
  autoFocus?: boolean;
};

export function GlobalSearch({ className = "", overlay = false, autoFocus = false }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      router.push(results[selectedIndex].href);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "project": return "📋";
      case "person": return "👤";
      case "organization": return "🏢";
      case "fund": return "💰";
      default: return "📄";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "project": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "person": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "organization": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "fund": return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${overlay ? "max-w-none" : "max-w-md"} ${className}`}
    >
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search projects, people, organizations..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        leftIcon={
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />

      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div
          className={`${
            overlay
              ? "mt-4 max-h-[60vh] rounded-2xl"
              : "absolute left-0 right-0 top-full mt-2 max-h-96 rounded-xl"
          } z-50 overflow-y-auto border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((result, index) => (
                <li key={`${result.type}-${result.id}`}>
                  <Link
                    href={result.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 transition-colors ${
                      index === selectedIndex
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <span className="text-lg">{getTypeIcon(result.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-white">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${getTypeColor(result.type)}`}>
                      {result.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              No results found for &quot;{query}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
