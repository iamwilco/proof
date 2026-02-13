"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Select, Button } from "@/components/ui";

interface FilterOption {
  value: string;
  label: string;
}

interface ProjectFiltersProps {
  funds: FilterOption[];
  categories: FilterOption[];
  statuses?: FilterOption[];
}

const defaultStatuses: FilterOption[] = [
  { value: "", label: "All Statuses" },
  { value: "complete", label: "Complete" },
  { value: "in_progress", label: "In Progress" },
  { value: "not_started", label: "Not Started" },
];

export function ProjectFilters({ funds, categories, statuses = defaultStatuses }: ProjectFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFund = searchParams.get("fund") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentSort = searchParams.get("sort") || "newest";

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters = currentFund || currentCategory || currentStatus;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        options={[{ value: "", label: "All Funds" }, ...funds]}
        value={currentFund}
        onChange={(e) => updateFilters("fund", e.target.value)}
        className="w-40"
      />

      <Select
        options={[{ value: "", label: "All Categories" }, ...categories]}
        value={currentCategory}
        onChange={(e) => updateFilters("category", e.target.value)}
        className="w-44"
      />

      <Select
        options={statuses}
        value={currentStatus}
        onChange={(e) => updateFilters("status", e.target.value)}
        className="w-36"
      />

      <Select
        options={[
          { value: "newest", label: "Newest First" },
          { value: "oldest", label: "Oldest First" },
          { value: "funding_high", label: "Funding: High to Low" },
          { value: "funding_low", label: "Funding: Low to High" },
          { value: "title_asc", label: "Title: A to Z" },
        ]}
        value={currentSort}
        onChange={(e) => updateFilters("sort", e.target.value)}
        className="w-44"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
