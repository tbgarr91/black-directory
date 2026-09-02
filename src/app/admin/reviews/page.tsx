"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminGate } from "@/components/AdminGate";
import { supabase } from "@/lib/supabase";

interface PendingReview {
  review_id: string;
  business_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  businessName?: string;
}

function ReviewsContent() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: pending } = await supabase
      .from("reviews")
      .select("review_id, business_id, rating, title, body, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const ids = [...new Set((pending ?? []).map((r) => r.business_id))];
    let nameMap = new Map<string, string>();
    if (ids.length > 0) {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("business_id, name")
        .in("business_id", ids);
      nameMap = new Map((businesses ?? []).map((b) => [b.business_id, b.name]));
    }

    setReviews(
      (pending ?? []).map((r) => ({ ...r, businessName: nameMap.get(r.business_id) ?? "Unknown business" }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(reviewId: string) {
    setBusyId(reviewId);
    await supabase.from("reviews").update({ status: "published" }).eq("review_id", reviewId);
    await load();
    setBusyId(null);
  }

  async function reject(reviewId: string) {
    setBusyId(reviewId);
    await supabase.from("reviews").update({ status: "removed" }).eq("review_id", reviewId);
    await load();
    setBusyId(null);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-display text-3xl text-ink">Pending reviews</h1>
      {loading ? (
        <p className="mt-6 text-sm text-ink-soft">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Nothing pending. All caught up.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-5">
          {reviews.map((r) => (
            <li key={r.review_id} className="border-b border-rule pb-5">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-ink">{r.businessName}</span>
                <span className="text-sm text-gold">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </div>
              {r.title && <p className="mt-1 text-sm font-medium text-ink">{r.title}</p>}
              {r.body && <p className="mt-1 text-sm text-ink-soft">{r.body}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => approve(r.review_id)}
                  disabled={busyId === r.review_id}
                  className="rounded-sm bg-indigo px-3 py-1.5 text-xs font-medium text-paper disabled:opacity-50"
                >
                  Publish
                </button>
                <button
                  onClick={() => reject(r.review_id)}
                  disabled={busyId === r.review_id}
                  className="rounded-sm border border-brick/40 bg-brick-bg px-3 py-1.5 text-xs font-medium text-brick disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function AdminReviewsPage() {
  return (
    <AdminGate>
      <ReviewsContent />
    </AdminGate>
  );
}
