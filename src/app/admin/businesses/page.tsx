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
  address_line1: string | null;
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
  const [addressEdits, setAddressEdits] = useState<Record<string, string>>({});
  const [savingAddressId, setSavingAddressId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: pending } = await supabase
      .from("businesses")
      .select(
        "business_id, name, description, short_tagline, website_url, email, city, state_region, address_line1, is_online_only, source_type, referral_note, created_at"
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
    setAddressEdits((prev) => {
      const next = { ...prev };
      for (const b of pending ?? []) {
        if (!(b.business_id in next)) next[b.business_id] = b.address_line1 ?? "";
      }
      return next;
    });
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

  async function saveAddress(businessId: string) {
    setSavingAddressId(businessId);
    const value = addressEdits[businessId]?.trim() || null;
    await supabase.from("businesses").update({ address_line1: value }).eq("business_id", businessId);

    if (value) {
      const business = businesses.find((b) => b.business_id === businessId);
      await fetch("/api/geocode-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          address: value,
          city: business?.city,
          stateRegion: business?.state_region,
        }),
      }).catch(() => {}); // best-effort — address is still saved either way
    }

    await load();
    setSavingAddressId(null);
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

              {!b.is_online_only && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={addressEdits[b.business_id] ?? ""}
                    onChange={(e) =>
                      setAddressEdits((prev) => ({ ...prev, [b.business_id]: e.target.value }))
                    }
                    placeholder="Street address (improves map accuracy)"
                    className="flex-1 rounded-sm border border-rule bg-paper px-3 py-1.5 text-xs focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/20"
                  />
                  <button
                    onClick={() => saveAddress(b.business_id)}
                    disabled={savingAddressId === b.business_id}
                    className="shrink-0 rounded-sm border border-rule px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-indigo hover:text-indigo transition-colors disabled:opacity-50"
                  >
                    {savingAddressId === b.business_id ? "Saving…" : "Save address"}
                  </button>
                </div>
              )}
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
