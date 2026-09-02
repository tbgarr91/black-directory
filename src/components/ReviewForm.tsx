"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function ReviewForm({ businessId }: { businessId: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    // No account required to review — but if the person happens to be
    // logged in, attribute the review to them.
    const { data: sessionData } = await supabase.auth.getSession();
    const reviewerId = sessionData.session?.user.id ?? null;
    const { error } = await supabase.from("reviews").insert({
      business_id: businessId,
      reviewer_user_id: reviewerId,
      rating,
      title: title || null,
      body: body || null,
      status: "pending",
    });
    setStatus(error ? "error" : "done");
  }

  if (status === "done") {
    return (
      <p className="rounded-sm border border-forest/30 bg-forest-bg px-4 py-3 text-sm text-forest">
        Thanks — your review is in the queue for moderation and will count
        toward this business's rating once approved.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className={`h-9 w-9 rounded-sm border text-sm transition-colors ${
                n <= rating
                  ? "border-gold bg-gold-bg text-gold"
                  : "border-rule text-ink-soft"
              }`}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink" htmlFor="review-title">
          Title (optional)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink" htmlFor="review-body">
          Your review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/20"
        />
      </div>
      {status === "error" && (
        <p className="text-sm text-brick">
          Something went wrong submitting your review. Please try again.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="self-start rounded-sm bg-indigo px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-dim transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
