"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export function FavoriteButton({ businessId }: { businessId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id ?? null;
      if (cancelled) return;
      setUserId(uid);

      if (uid) {
        const { data } = await supabase
          .from("favorites")
          .select("business_id")
          .eq("user_id", uid)
          .eq("business_id", businessId)
          .maybeSingle();
        if (!cancelled) setFavorited(Boolean(data));
      }
      if (!cancelled) setChecking(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  async function toggle() {
    if (!userId) return;
    if (favorited) {
      await supabase.from("favorites").delete().eq("user_id", userId).eq("business_id", businessId);
      setFavorited(false);
    } else {
      await supabase.from("favorites").insert({ user_id: userId, business_id: businessId });
      setFavorited(true);
    }
  }

  if (checking) return null;

  if (!userId) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 text-xs text-ink-soft hover:border-indigo hover:text-indigo transition-colors"
      >
        <HeartIcon filled={false} /> Log in to save
      </Link>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs transition-colors ${
        favorited
          ? "border-brick/40 bg-brick-bg text-brick"
          : "border-rule text-ink-soft hover:border-brick/40 hover:text-brick"
      }`}
    >
      <HeartIcon filled={favorited} /> {favorited ? "Saved" : "Save"}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M8 13.5s-5.5-3.3-5.5-7A3 3 0 0 1 8 4.5a3 3 0 0 1 5.5 2c0 3.7-5.5 7-5.5 7z" />
    </svg>
  );
}
