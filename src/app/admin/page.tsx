"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminGate } from "@/components/AdminGate";
import { supabase } from "@/lib/supabase";

function DashboardContent() {
  const [pendingBusinesses, setPendingBusinesses] = useState<number | null>(null);
  const [pendingReviews, setPendingReviews] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [{ count: bCount }, { count: rCount }] = await Promise.all([
        supabase.from("businesses").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setPendingBusinesses(bCount ?? 0);
      setPendingReviews(rCount ?? 0);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Admin</h1>
        <button onClick={signOut} className="text-sm text-ink-soft underline">
          Sign out
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/admin/businesses"
          className="flex items-center justify-between rounded-sm border border-rule px-4 py-4 hover:border-indigo transition-colors"
        >
          <span className="font-medium text-ink">Pending businesses</span>
          <span className="text-ink-soft">{pendingBusinesses ?? "…"}</span>
        </Link>
        <Link
          href="/admin/reviews"
          className="flex items-center justify-between rounded-sm border border-rule px-4 py-4 hover:border-indigo transition-colors"
        >
          <span className="font-medium text-ink">Pending reviews</span>
          <span className="text-ink-soft">{pendingReviews ?? "…"}</span>
        </Link>
        <Link
          href="/admin/qr"
          className="flex items-center justify-between rounded-sm border border-rule px-4 py-4 hover:border-indigo transition-colors"
        >
          <span className="font-medium text-ink">Submission QR code</span>
          <span className="text-ink-soft">→</span>
        </Link>
      </div>
    </main>
  );
}

export default function AdminDashboard() {
  return (
    <AdminGate>
      <DashboardContent />
    </AdminGate>
  );
}
