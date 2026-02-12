"use client";

import { useState } from "react";

type FeedbackFormProps = {
  projectId: string;
};

type FormState = "idle" | "loading" | "success" | "error";

const concernCategories = [
  "financial",
  "delivery",
  "governance",
  "transparency",
  "other",
];

export default function FeedbackForm({ projectId }: FeedbackFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [concernCategory, setConcernCategory] = useState("financial");
  const [concernDescription, setConcernDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [ratingState, setRatingState] = useState<FormState>("idle");
  const [concernState, setConcernState] = useState<FormState>("idle");
  const [ratingMessage, setRatingMessage] = useState("");
  const [concernMessage, setConcernMessage] = useState("");

  const submitRating = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRatingState("loading");
    setRatingMessage("");

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, score: rating, comment }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Unable to submit rating");
      }

      setRatingState("success");
      setRatingMessage("Thanks! Your rating has been submitted.");
    } catch (error) {
      setRatingState("error");
      setRatingMessage(
        error instanceof Error ? error.message : "Unable to submit rating"
      );
    }
  };

  const submitConcern = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConcernState("loading");
    setConcernMessage("");

    try {
      const res = await fetch("/api/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          category: concernCategory,
          description: concernDescription,
          evidenceUrl: evidenceUrl || null,
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Unable to submit concern");
      }

      setConcernState("success");
      setConcernMessage("Concern submitted for review.");
      setConcernDescription("");
      setEvidenceUrl("");
    } catch (error) {
      setConcernState("error");
      setConcernMessage(
        error instanceof Error ? error.message : "Unable to submit concern"
      );
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Rate this project</h2>
        <p className="mt-2 text-sm text-slate-500">
          Ratings are visible to the team and help prioritize reviews.
        </p>
        <form onSubmit={submitRating} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Score
            <select
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Comment (optional)
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={ratingState === "loading"}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {ratingState === "loading" ? "Submitting…" : "Submit rating"}
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" required className="accent-blue-600" />
            I&apos;m not a robot (captcha placeholder)
          </label>
        </form>
        {ratingMessage && (
          <p
            className={`mt-3 text-sm ${
              ratingState === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {ratingMessage}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Flag a concern</h2>
        <p className="mt-2 text-sm text-slate-500">
          Concerns are reviewed by moderators before appearing publicly.
        </p>
        <form onSubmit={submitConcern} className="mt-5 space-y-4">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" required className="accent-slate-900" />
            I&apos;m not a robot (captcha placeholder)
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Category
            <select
              value={concernCategory}
              onChange={(event) => setConcernCategory(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {concernCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              value={concernDescription}
              onChange={(event) => setConcernDescription(event.target.value)}
              rows={4}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Evidence URL (optional)
            <input
              type="url"
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>

          <button
            type="submit"
            disabled={concernState === "loading"}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {concernState === "loading" ? "Submitting…" : "Submit concern"}
          </button>
        </form>
        {concernMessage && (
          <p
            className={`mt-3 text-sm ${
              concernState === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {concernMessage}
          </p>
        )}
      </div>
    </section>
  );
}
