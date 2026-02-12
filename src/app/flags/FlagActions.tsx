"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface FlagActionsProps {
  flagId: string;
  currentStatus: string;
}

export default function FlagActions({ flagId, currentStatus }: FlagActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update flag:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <span className="text-xs text-slate-400">Updating...</span>;
  }

  if (currentStatus === "pending") {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => updateStatus("confirmed")}
          className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
        >
          Confirm
        </button>
        <button
          onClick={() => updateStatus("dismissed")}
          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (currentStatus === "confirmed") {
    return (
      <button
        onClick={() => updateStatus("resolved")}
        className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
      >
        Mark Resolved
      </button>
    );
  }

  return <span className="text-xs text-slate-400">—</span>;
}
