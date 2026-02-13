"use client";

import { useState } from "react";

interface AccountabilityDisputeFormProps {
  scoreId: string;
  onSubmitted?: () => void;
}

export default function AccountabilityDisputeForm({
  scoreId,
  onSubmitted,
}: AccountabilityDisputeFormProps) {
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/accountability/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreId, reason, evidence: evidence || null }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || "Unable to submit dispute");
      }

      setStatus("success");
      setMessage("Dispute submitted. Admins will review within 14 days.");
      setReason("");
      setEvidence("");
      onSubmitted?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit dispute");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Dispute reason
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          required
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Evidence link (optional)
        <input
          type="url"
          value={evidence}
          onChange={(event) => setEvidence(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="https://"
        />
      </label>

      {message && (
        <p
          className={`text-sm ${status === "error" ? "text-rose-600" : "text-emerald-600"}`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !reason}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {status === "loading" ? "Submitting…" : "Submit dispute"}
      </button>
    </form>
  );
}
