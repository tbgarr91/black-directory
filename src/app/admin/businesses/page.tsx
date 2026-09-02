"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminGate } from "@/components/AdminGate";
import { supabase } from "@/lib/supabase";

interface PendingBusiness {
  business_id: string;
  name: string;
  description: string | null;
  short_tagline: string | null;
  website_url: string | null;
  email: string | null;
  city: string | null;
  state_region: string | null;
  is_online_only: boolean;
  source_type: string;
  referral_note: string | null;
  created_at: string;
  ownershipStatus: string | null;
}

function BusinessesContent() {
  const [businesses, setBusinesses] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: pending } = await supabase
      .from("businesses")
      .select(
        "business_id, name, description, short_tagline, website_url, email, city, state_region, is_online_only, source_type, referral_note, created_at"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const ids = (pending ?? []).map((b) => b.business_id);
    let ownershipMap = new Map<string, string>();
    if (ids.length > 0) {
      const { data: verifications } = await supabase
        .from("ownership_verifications")
        .select("business_id, status")
        .in("business_id", ids);
      ownershipMap = new Map((verifications ?? []).map((v) => [v.business_id, v.status]));
    }

    setBusinesses(
      (pending ?? []).map((b) => ({
        ...b,
        ownershipStatus: ownershipMap.get(b.business_id) ?? null,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function verifyOwnership(businessId: string) {
    setBusyId(businessId);
    // Upsert: insert if no verification row exists yet, otherwise update it.
    const { data: existing } = await supabase
      .from("ownership_verifications")
      .select("verification_id")
      .eq("business_id", businessId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("ownership_verifications")
        .update({ status: "verified", method: "manual_research", reviewed_at: new Date().toISOString() })
        .eq("business_id", businessId);
    } else {
      await supabase.from("ownership_verifications").insert({
        business_id: businessId,
        status: "verified",
        method: "manual_research",
        reviewed_at: new Date().toISOString(),
      });
    }
    await load();
    setBusyId(null);
  }

  async function publish(businessId: string) {
    setBusyId(businessId);
    await supabase.from("businesses").update({ status: "active" }).eq("business_id", businessId);
    await load();
    setBusyId(null);
  }

  async function reject(businessId: string) {
    setBusyId(businessId);
    await supabase.from("businesses").update({ status: "suspended" }).eq("business_id", businessId);
    await load();
    setBusyId(null);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-display text-3xl text-ink">Pending businesses</h1>
      {loading ? (
        <p className="mt-6 text-sm text-ink-soft">Loading…</p>
      ) : businesses.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Nothing pending. All caught up.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-6">
          {businesses.map((b) => (
            <li key={b.business_id} className="border-b border-rule pb-6">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl text-ink">{b.name}</h2>
                <span className="text-xs text-ink-soft">
                  {new Date(b.created_at).toLocaleDateString()}
                </span>
              </div>
              {b.short_tagline && <p className="text-sm text-ink-soft">{b.short_tagline}</p>}
              {b.description && <p className="mt-1 text-sm text-ink">{b.description}</p>}
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-soft">
                {b.website_url && <div>Website: {b.website_url}</div>}
                {b.email && <div>Email: {b.email}</div>}
                <div>
                  Location:{" "}
                  {b.is_online_only ? "Online only" : [b.city, b.state_region].filter(Boolean).join(", ") || "—"}
                </div>
                <div>Source: {b.source_type}</div>
                {b.referral_note && <div className="col-span-2">Note: {b.referral_note}</div>}
                <div className="col-span-2">
                  Ownership: {b.ownershipStatus === "verified" ? "✓ Verified" : "Not yet verified"}
                </div>
              </dl>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => verifyOwnership(b.business_id)}
                  disabled={busyId === b.business_id || b.ownershipStatus === "verified"}
                  className="rounded-sm border border-forest/40 bg-forest-bg px-3 py-1.5 text-xs font-medium text-forest disabled:opacity-50"
                >
                  {b.ownershipStatus === "verified" ? "Ownership verified" : "Verify ownership"}
                </button>
                <button
                  onClick={() => publish(b.business_id)}
                  disabled={busyId === b.business_id}
                  className="rounded-sm bg-indigo px-3 py-1.5 text-xs font-medium text-paper disabled:opacity-50"
                >
                  Publish (make active)
                </button>
                <button
                  onClick={() => reject(b.business_id)}
                  disabled={busyId === b.business_id}
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

export default function AdminBusinessesPage() {
  return (
    <AdminGate>
      <BusinessesContent />
    </AdminGate>
  );
}
