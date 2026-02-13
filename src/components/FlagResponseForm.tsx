"use client";

import { useState } from "react";

interface FlagResponseFormProps {
  flagId: string;
  flagTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FlagResponseForm({
  flagId,
  flagTitle,
  onSuccess,
  onCancel,
}: FlagResponseFormProps) {
  const [response, setResponse] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/flags/${flagId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response,
          evidenceUrl: evidenceUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit response");
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mb-2 text-2xl">✓</div>
        <h3 className="text-lg font-semibold text-green-800">Response Submitted</h3>
        <p className="mt-1 text-sm text-green-700">
          Your response has been submitted and will be reviewed by moderators.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm text-amber-800">
          Responding to: <span className="font-medium">{flagTitle}</span>
        </p>
      </div>

      <div>
        <label htmlFor="response" className="mb-2 block text-sm font-medium text-slate-700">
          Your Response <span className="text-red-500">*</span>
        </label>
        <textarea
          id="response"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Explain your perspective on this flag. Provide any clarifications or context that moderators should consider..."
          required
          rows={5}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="evidence-url" className="mb-2 block text-sm font-medium text-slate-700">
          Supporting Evidence URL <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="evidence-url"
          type="url"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          Link to documentation, progress updates, or other evidence supporting your response.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!response || isSubmitting}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Submitting..." : "Submit Response"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
