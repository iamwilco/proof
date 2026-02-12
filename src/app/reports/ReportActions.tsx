"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReportActionsProps {
  reportId: string;
  status: string;
}

export default function ReportActions({ reportId, status }: ReportActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async (nextStatus: "approved" | "flagged" | "pending") => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status: nextStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update report", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <span className="text-xs text-slate-400">Updating...</span>;
  }

  if (status === "pending") {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => updateStatus("approved")}
          className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
        >
          Approve
        </button>
        <button
          onClick={() => updateStatus("flagged")}
          className="rounded bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200"
        >
          Flag
        </button>
      </div>
    );
  }

  if (status === "flagged") {
    return (
      <button
        onClick={() => updateStatus("approved")}
        className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
      >
        Approve
      </button>
    );
  }

  return <span className="text-xs text-slate-400">—</span>;
}
