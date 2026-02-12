"use client";

import { useState } from "react";

const FLAG_CATEGORIES = [
  {
    value: "repeat_delays",
    label: "Repeat Delays",
    description: "Proposer has a history of delayed or incomplete projects",
  },
  {
    value: "ghost_project",
    label: "Ghost Project",
    description: "Project appears abandoned with no recent updates or communication",
  },
  {
    value: "plagiarism",
    label: "Plagiarism",
    description: "Content copied from other proposals or external sources",
  },
  {
    value: "misleading_claims",
    label: "Misleading Claims",
    description: "False or exaggerated claims about team, experience, or deliverables",
  },
  {
    value: "conflict_of_interest",
    label: "Conflict of Interest",
    description: "Undisclosed relationships that could affect objectivity",
  },
  {
    value: "fund_misuse",
    label: "Fund Misuse",
    description: "Funds not being used as stated in the proposal",
  },
  {
    value: "other",
    label: "Other",
    description: "Other concerns not covered by the categories above",
  },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-yellow-100 text-yellow-800" },
  { value: "medium", label: "Medium", color: "bg-orange-100 text-orange-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
];

interface FlagSubmissionFormProps {
  projectId: string;
  projectTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FlagSubmissionForm({
  projectId,
  projectTitle,
  onSuccess,
  onCancel,
}: FlagSubmissionFormProps) {
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedCategory = FLAG_CATEGORIES.find((c) => c.value === category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          flagCategory: category,
          severity,
          title,
          description,
          evidenceUrl: evidenceUrl || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit flag");
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
        <h3 className="text-lg font-semibold text-green-800">Flag Submitted</h3>
        <p className="mt-1 text-sm text-green-700">
          Thank you for helping maintain transparency. Your flag will be reviewed by moderators.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setCategory("");
            setTitle("");
            setDescription("");
            setEvidenceUrl("");
          }}
          className="mt-4 text-sm text-green-600 hover:underline"
        >
          Submit another flag
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-600">
          Flagging: <span className="font-medium text-slate-900">{projectTitle}</span>
        </p>
      </div>

      {/* Category Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-2">
          {FLAG_CATEGORIES.map((cat) => (
            <label
              key={cat.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                category === cat.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={category === cat.value}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-slate-900">{cat.label}</span>
                <p className="text-sm text-slate-500">{cat.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Severity</label>
        <div className="flex gap-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSeverity(opt.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                severity === opt.value
                  ? opt.color + " ring-2 ring-offset-1"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="flag-title" className="mb-2 block text-sm font-medium text-slate-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="flag-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of the concern"
          required
          maxLength={200}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="flag-description" className="mb-2 block text-sm font-medium text-slate-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="flag-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            selectedCategory
              ? `Describe why you believe this project has ${selectedCategory.label.toLowerCase()} issues...`
              : "Provide details about your concern..."
          }
          required
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Evidence URL */}
      <div>
        <label htmlFor="flag-evidence" className="mb-2 block text-sm font-medium text-slate-700">
          Evidence URL <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="flag-evidence"
          type="url"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          Link to screenshots, documents, or other evidence supporting your flag.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!category || !title || !description || isSubmitting}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Submitting..." : "Submit Flag"}
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

      <p className="text-center text-xs text-slate-500">
        Flags are reviewed by community moderators. False or malicious flags may result in
        reputation penalties.
      </p>
    </form>
  );
}
