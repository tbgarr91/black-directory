"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BusinessListing } from "@/components/BusinessListing";
import { supabase, type BusinessSearchResult } from "@/lib/supabase";

export default function FavoritesPage() {
  const [state, setState] = useState<"checking" | "signed-out" | "loaded">("checking");
  const [businesses, setBusinesses] = useState<BusinessSearchResult[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        if (!cancelled) setState("signed-out");
        return;
      }

      const { data: favs } = await supabase
        .from("favorites")
        .select("business_id")
        .eq("user_id", session.user.id);

      const ids = (favs ?? []).map((f) => f.business_id);
      if (ids.length === 0) {
        if (!cancelled) {
          setBusinesses([]);
          setState("loaded");
        }
        return;
      }

      const { data: results } = await supabase
        .from("business_search_view")
        .select("*")
        .in("business_id", ids);

      if (!cancelled) {
        setBusinesses(results ?? []);
        setState("loaded");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
        <h1 className="font-display text-3xl text-ink">Your saved businesses</h1>

        {state === "checking" && <p className="mt-6 text-sm text-ink-soft">Loading…</p>}

        {state === "signed-out" && (
          <p className="mt-6 text-sm text-ink-soft">
            <Link href="/login" className="text-indigo underline">Log in</Link> to see and manage your saved businesses.
          </p>
        )}

        {state === "loaded" && businesses.length === 0 && (
          <p className="mt-6 text-sm text-ink-soft">
            Nothing saved yet. Find a business and tap "Save" on its page.
          </p>
        )}

        {state === "loaded" && businesses.length > 0 && (
          <div className="mt-6">
            {businesses.map((b) => (
              <BusinessListing key={b.business_id} business={b} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
