"use client";

import { useState } from "react";

type Concern = {
  id: string;
  description: string;
  category: string;
  status: string;
};

type LeaderResponsePanelProps = {
  projectId: string;
  concerns: Concern[];
};

type FormState = "idle" | "loading" | "success" | "error";

export default function LeaderResponsePanel({
  projectId,
  concerns,
}: LeaderResponsePanelProps) {
  const [claimState, setClaimState] = useState<FormState>("idle");
  const [claimMessage, setClaimMessage] = useState("");
  const [responseState, setResponseState] = useState<FormState>("idle");
  const [responseMessage, setResponseMessage] = useState("");
  const [selectedConcern, setSelectedConcern] = useState(concerns[0]?.id ?? "");
  const [responseText, setResponseText] = useState("");

  const submitClaim = async () => {
    setClaimState("loading");
    setClaimMessage("");
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Unable to submit claim");
      }
      setClaimState("success");
      setClaimMessage("Claim submitted. A moderator will review it shortly.");
    } catch (error) {
      setClaimState("error");
      setClaimMessage(
        error instanceof Error ? error.message : "Unable to submit claim"
      );
    }
  };

  const submitResponse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResponseState("loading");
    setResponseMessage("");

    try {
      const res = await fetch(`/api/concerns/${selectedConcern}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: responseText }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Unable to submit response");
      }
      setResponseState("success");
      setResponseMessage("Response submitted.");
      setResponseText("");
    } catch (error) {
      setResponseState("error");
      setResponseMessage(
        error instanceof Error ? error.message : "Unable to submit response"
      );
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Leader Actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Claim this project or respond to a concern.
          </p>
        </div>
        <button
          type="button"
          onClick={submitClaim}
          disabled={claimState === "loading"}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {claimState === "loading" ? "Submitting…" : "Claim project"}
        </button>
      </div>
      {claimMessage && (
        <p
          className={`mt-3 text-sm ${
            claimState === "error" ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {claimMessage}
        </p>
      )}

      <form onSubmit={submitResponse} className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Concern
          <select
            value={selectedConcern}
            onChange={(event) => setSelectedConcern(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={concerns.length === 0}
          >
            {concerns.length === 0 && <option>No concerns available</option>}
            {concerns.map((concern) => (
              <option key={concern.id} value={concern.id}>
                {concern.category} · {concern.status}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Response
          <textarea
            value={responseText}
            onChange={(event) => setResponseText(event.target.value)}
            rows={3}
            required
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={responseState === "loading" || concerns.length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {responseState === "loading" ? "Submitting…" : "Submit response"}
        </button>
      </form>
      {responseMessage && (
        <p
          className={`mt-3 text-sm ${
            responseState === "error" ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {responseMessage}
        </p>
      )}
    </section>
  );
}
