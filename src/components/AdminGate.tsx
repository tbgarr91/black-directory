"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type GateState = "checking" | "signed-out" | "not-admin" | "admin";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        if (!cancelled) setState("signed-out");
        return;
      }
      setEmail(session.user.email ?? null);

      // admin_users has zero public policies, so this returns empty for
      // anyone who isn't in it — that emptiness IS the "not admin" signal.
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setState("not-admin");
      } else {
        setState("admin");
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "checking") {
    return <p className="p-8 text-sm text-ink-soft">Checking access…</p>;
  }

  if (state === "signed-out") {
    return (
      <div className="p-8">
        <p className="text-sm text-ink-soft">
          You need to log in to view this page.
        </p>
        <Link href="/admin/login" className="mt-2 inline-block text-sm text-indigo underline">
          Go to login
        </Link>
      </div>
    );
  }

  if (state === "not-admin") {
    return (
      <div className="p-8">
        <p className="text-sm text-ink-soft">
          Signed in as {email}, but this account hasn't been granted admin
          access yet. Ask the site owner to add you.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-rule bg-paper-dim">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-3 text-sm">
          <Link href="/admin" className="font-medium text-ink hover:text-indigo transition-colors">
            Admin dashboard
          </Link>
          <span className="text-rule">·</span>
          <Link href="/" className="text-ink-soft hover:text-indigo transition-colors">
            View site
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
