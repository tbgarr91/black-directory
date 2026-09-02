"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Header() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setEmail(data.session?.user.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-2xl tracking-tight text-ink">
          The Ledger
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/search" className="text-ink-soft hover:text-ink transition-colors">
            Browse
          </Link>
          {email && (
            <Link href="/favorites" className="text-ink-soft hover:text-ink transition-colors">
              Saved
            </Link>
          )}
          {email === undefined ? null : email ? (
            <button onClick={signOut} className="text-ink-soft hover:text-ink transition-colors">
              Log out
            </button>
          ) : (
            <Link href="/login" className="text-ink-soft hover:text-ink transition-colors">
              Log in
            </Link>
          )}
          <Link
            href="/submit"
            className="rounded-sm bg-indigo px-3.5 py-1.5 text-paper hover:bg-indigo-dim transition-colors"
          >
            List your business
          </Link>
        </nav>
      </div>
    </header>
  );
}
