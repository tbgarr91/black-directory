"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search a category, or a brand you want an alternative to…"
        className="w-full rounded-sm border border-rule bg-paper px-4 py-3 text-ink placeholder:text-ink-soft/60 focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/20"
      />
      <button
        type="submit"
        className="shrink-0 rounded-sm bg-indigo px-5 py-3 text-sm font-medium text-paper hover:bg-indigo-dim transition-colors"
      >
        Search
      </button>
    </form>
  );
}
