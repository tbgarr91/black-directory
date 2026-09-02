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
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        if (!cancelled) setState("signed-out");
        return;
      }
      if (!cancelled) setEmail(session.user.email ?? null);

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
        {state === "checking" && <p className="text-sm text-ink-soft">Loading…</p>}

        {state === "signed-out" && (
          <>
            <h1 className="font-display text-3xl text-ink">Your account</h1>
            <p className="mt-4 text-sm text-ink-soft">
              <Link href="/login" className="text-indigo underline">Log in</Link> to save
              businesses, leave reviews under your name, and see them here.
            </p>
          </>
        )}

        {state === "loaded" && (
          <>
            <h1 className="font-display text-3xl text-ink">Your saved businesses</h1>
            {email && <p className="mt-1 text-sm text-ink-soft">{email}</p>}

            {businesses.length === 0 ? (
              <div className="mt-8 rounded-sm border border-rule px-5 py-6 text-center">
                <p className="text-sm text-ink-soft">
                  Nothing saved yet. Find a business you like and tap "Save" on its page.
                </p>
                <Link
                  href="/search"
                  className="mt-3 inline-block rounded-sm bg-indigo px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-dim transition-colors"
                >
                  Start browsing
                </Link>
              </div>
            ) : (
              <div className="mt-8">
                {businesses.map((b) => (
                  <BusinessListing key={b.business_id} business={b} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
