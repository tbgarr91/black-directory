"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "check-email">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
        return;
      }
      router.push("/admin");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
        return;
      }
      setStatus("check-email");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-2xl text-ink">Admin access</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {mode === "login"
          ? "Log in to review pending listings and reviews."
          : "Create an account. You'll still need to be granted admin access separately before you can see anything."}
      </p>

      {status === "check-email" ? (
        <p className="mt-6 rounded-sm border border-forest/30 bg-forest-bg px-4 py-3 text-sm text-forest">
          Account created. Check your email to confirm it, then log in — and
          let the site owner know your email so they can grant admin access.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/20"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/20"
          />
          {status === "error" && <p className="text-sm text-brick">{errorMsg}</p>}
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-sm bg-indigo px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-dim transition-colors disabled:opacity-60"
          >
            {status === "loading" ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      )}

      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-4 self-start text-sm text-indigo underline"
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </main>
  );
}
