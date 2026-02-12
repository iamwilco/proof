"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Review = {
  id: string;
  rating: number;
  title: string;
  content: string;
  alignmentScore?: number | null;
  feasibilityScore?: number | null;
  auditabilityScore?: number | null;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  user?: { id: string; displayName: string | null; walletAddress: string | null };
};

type ReviewResponse = {
  reviews: Review[];
  averages: {
    rating?: number | null;
    alignmentScore?: number | null;
    feasibilityScore?: number | null;
    auditabilityScore?: number | null;
  };
};

type ReviewSectionProps = {
  projectId: string;
};

type FormState = "idle" | "loading" | "success" | "error";

type VoteState = "idle" | "loading" | "success" | "error";

const scoreLabel = (value?: number | null) => (value ? value.toFixed(1) : "—");

export default function ReviewSection({ projectId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averages, setAverages] = useState<ReviewResponse["averages"]>({});
  const [reviewState, setReviewState] = useState<FormState>("idle");
  const [reviewMessage, setReviewMessage] = useState("");
  const [voteState, setVoteState] = useState<Record<string, VoteState>>({});

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [alignmentScore, setAlignmentScore] = useState(5);
  const [feasibilityScore, setFeasibilityScore] = useState(5);
  const [auditabilityScore, setAuditabilityScore] = useState(5);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const reviewStats = useMemo(() => {
    const ratingAvg = averages.rating ? averages.rating.toFixed(1) : "—";
    return {
      ratingAvg,
      alignmentAvg: scoreLabel(averages.alignmentScore),
      feasibilityAvg: scoreLabel(averages.feasibilityScore),
      auditabilityAvg: scoreLabel(averages.auditabilityScore),
    };
  }, [averages]);

  const loadReviews = useCallback(async () => {
    const response = await fetch(`/api/reviews?projectId=${projectId}`);
    if (!response.ok) {
      throw new Error("Unable to load reviews.");
    }
    const payload = (await response.json()) as ReviewResponse;
    setReviews(payload.reviews ?? []);
    setAverages(payload.averages ?? {});
  }, [projectId]);

  useEffect(() => {
    loadReviews().catch((error) => {
      setReviewMessage(error instanceof Error ? error.message : "Unable to load reviews.");
      setReviewState("error");
    });
  }, [loadReviews]);

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setReviewState("error");
      setReviewMessage("Title and review body are required.");
      return;
    }

    setReviewState("loading");
    setReviewMessage("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          rating,
          title,
          content,
          alignmentScore,
          feasibilityScore,
          auditabilityScore,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Unable to submit review" }));
        throw new Error(payload.error || "Unable to submit review.");
      }

      setTitle("");
      setContent("");
      setReviewState("success");
      setReviewMessage("Review submitted. Thank you!");
      await loadReviews();
    } catch (error) {
      setReviewState("error");
      setReviewMessage(error instanceof Error ? error.message : "Unable to submit review.");
    }
  };

  const submitVote = async (reviewId: string, value: 1 | -1) => {
    setVoteState((prev) => ({ ...prev, [reviewId]: "loading" }));
    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Unable to vote." }));
        throw new Error(payload.error || "Unable to vote.");
      }

      setVoteState((prev) => ({ ...prev, [reviewId]: "success" }));
      await loadReviews();
    } catch (error) {
      setVoteState((prev) => ({ ...prev, [reviewId]: "error" }));
      setReviewMessage(error instanceof Error ? error.message : "Unable to vote.");
      setReviewState("error");
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Community reviews</h2>
        <p className="mt-2 text-sm text-slate-500">
          Share structured feedback on alignment, feasibility, and auditability.
        </p>

        <form onSubmit={submitReview} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Overall rating
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
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Summarize your take"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Review
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Alignment
              <select
                value={alignmentScore}
                onChange={(event) => setAlignmentScore(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Feasibility
              <select
                value={feasibilityScore}
                onChange={(event) => setFeasibilityScore(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Auditability
              <select
                value={auditabilityScore}
                onChange={(event) => setAuditabilityScore(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={reviewState === "loading"}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {reviewState === "loading" ? "Submitting…" : "Submit review"}
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" required className="accent-slate-900" />
            I&apos;m not a robot (captcha placeholder)
          </label>
        </form>

        {reviewMessage && (
          <p
            className={`mt-3 text-sm ${
              reviewState === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {reviewMessage}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Review snapshot</h3>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            {reviewStats.ratingAvg}
          </span>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Alignment</span>
            <span className="font-medium text-slate-900">{reviewStats.alignmentAvg}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Feasibility</span>
            <span className="font-medium text-slate-900">{reviewStats.feasibilityAvg}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Auditability</span>
            <span className="font-medium text-slate-900">{reviewStats.auditabilityAvg}</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">No reviews yet.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{review.title}</p>
                    <p className="text-xs text-slate-500">
                      {review.user?.displayName || review.user?.walletAddress || "Anonymous"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                    {review.rating}/5
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{review.content}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => submitVote(review.id, 1)}
                      disabled={voteState[review.id] === "loading"}
                      className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white"
                    >
                      Helpful ({review.helpfulCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => submitVote(review.id, -1)}
                      disabled={voteState[review.id] === "loading"}
                      className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white"
                    >
                      Not helpful ({review.notHelpfulCount})
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
