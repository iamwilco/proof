"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DisputeActionsProps {
  disputeId: string;
  status: string;
}

export default function DisputeActions({ disputeId, status }: DisputeActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async (nextStatus: "approved" | "rejected") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/accountability/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status !== "pending") {
    return <span className="text-xs text-slate-400">Reviewed</span>;
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => updateStatus("approved")}
        disabled={isLoading}
        className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-60"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => updateStatus("rejected")}
        disabled={isLoading}
        className="rounded bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200 disabled:opacity-60"
      >
        Reject
      </button>
    </div>
  );
}
