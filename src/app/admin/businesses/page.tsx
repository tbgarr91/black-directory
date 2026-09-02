"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const [geocodedCoords, setGeocodedCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [geocodeError, setGeocodeError] = useState<Record<string, string>>({});
  const attemptedGeocodeRef = useRef<Set<string>>(new Set());

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

  // Auto-geocode any business that already has an address but no verified
  // pin yet — so by the time you're reading a card, the "view pin" link is
  // already there instead of waiting on a manual click. Runs one at a time
  // with a short delay between calls (Nominatim's free tier asks for no
  // more than ~1 request/second).
  useEffect(() => {
    const toGeocode = businesses.filter(
      (b) => !b.is_online_only && b.address_line1 && !attemptedGeocodeRef.current.has(b.business_id)
    );
    if (toGeocode.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const b of toGeocode) {
        if (cancelled) return;
        attemptedGeocodeRef.current.add(b.business_id);

        try {
          const res = await fetch("/api/geocode-business", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessId: b.business_id,
              address: b.address_line1,
              city: b.city,
              stateRegion: b.state_region,
            }),
          });
          const json = await res.json();
          if (cancelled) return;
          if (json.success) {
            setGeocodedCoords((prev) => ({ ...prev, [b.business_id]: { lat: json.lat, lng: json.lng } }));
          } else {
            setGeocodeError((prev) => ({ ...prev, [b.business_id]: json.error || "Couldn't locate that address." }));
          }
        } catch {
          if (!cancelled) {
            setGeocodeError((prev) => ({ ...prev, [b.business_id]: "Network error while geocoding." }));
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businesses]);

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
    setGeocodeError((prev) => ({ ...prev, [businessId]: "" }));
    const value = addressEdits[businessId]?.trim() || null;
    await supabase.from("businesses").update({ address_line1: value }).eq("business_id", businessId);

    if (value) {
      const business = businesses.find((b) => b.business_id === businessId);
      try {
        const res = await fetch("/api/geocode-business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            address: value,
            city: business?.city,
            stateRegion: business?.state_region,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setGeocodedCoords((prev) => ({ ...prev, [businessId]: { lat: json.lat, lng: json.lng } }));
        } else {
          setGeocodeError((prev) => ({ ...prev, [businessId]: json.error || "Couldn't locate that address." }));
        }
      } catch {
        setGeocodeError((prev) => ({ ...prev, [businessId]: "Network error while geocoding." }));
      }
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
                <div className="mt-3">
                  <div className="flex items-center gap-2">
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
                      {savingAddressId === b.business_id ? "Locating…" : "Save & locate"}
                    </button>
                  </div>

                  {geocodedCoords[b.business_id] && (
                    <a
                      href={`https://www.google.com/maps?q=${geocodedCoords[b.business_id].lat},${geocodedCoords[b.business_id].lng}(${encodeURIComponent(b.name)})`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-forest underline"
                    >
                      ✓ Located — view pin on map to verify before publishing
                    </a>
                  )}
                  {geocodeError[b.business_id] && (
                    <p className="mt-1 text-xs text-brick">{geocodeError[b.business_id]}</p>
                  )}
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
