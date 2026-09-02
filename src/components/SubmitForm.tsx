"use client";

import { useState, useRef } from "react";
import type { Category } from "@/lib/supabase";

export function SubmitForm({ categories }: { categories: Category[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagline, setTagline] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.category_id ?? "");
  const [referralNote, setReferralNote] = useState("");
  const [honeypot, setHoneypot] = useState(""); // real users never see or fill this
  const formLoadedAt = useRef(Date.now());
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/submit-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description,
          tagline,
          website,
          email,
          city,
          stateRegion,
          addressLine1,
          isOnlineOnly: onlineOnly,
          categoryId,
          referralNote,
          honeypot,
          formLoadedAt: formLoadedAt.current,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatus("error");
        setErrorMsg(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-sm border border-forest/30 bg-forest-bg px-4 py-4 text-sm text-forest">
        Thanks — it's in the queue. We'll verify ownership and publish it
        once that's confirmed.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Business name" required>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="input"
        />
      </Field>

      <Field label="One-line tagline">
        <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="input" />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input"
        />
      </Field>

      <Field label="Category">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="input"
        >
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={onlineOnly}
          onChange={(e) => setOnlineOnly(e.target.checked)}
        />
        Online only / ships nationwide
      </label>

      {!onlineOnly && (
        <Field label="Street address (optional, but makes maps directions accurate)">
          <input
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="e.g. 123 Main St"
            className="input"
          />
          <span className="mt-1 block text-xs text-ink-soft">
            Just the street — city and state below get added automatically.
          </span>
        </Field>
      )}

      {!onlineOnly && (
        <div className="flex gap-3">
          <Field label="City" className="flex-1">
            <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
          </Field>
          <Field label="State" className="w-28">
            <input
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              className="input"
            />
          </Field>
        </div>
      )}

      <Field label="Website">
        <input value={website} onChange={(e) => setWebsite(e.target.value)} className="input" />
      </Field>

      <Field label="Contact email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
      </Field>

      <Field label="How do you know this business? (optional)">
        <input
          value={referralNote}
          onChange={(e) => setReferralNote(e.target.value)}
          placeholder="e.g. met the owner at a local expo"
          className="input"
        />
      </Field>

      {/* Honeypot: invisible to real users, but bots that fill every field trip it. */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Leave this field blank
          <input
            type="text"
            name="company_website_confirm"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      {status === "error" && (
        <p className="text-sm text-brick">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 self-start rounded-sm bg-indigo px-5 py-2.5 text-sm font-medium text-paper hover:bg-indigo-dim transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Submit for review"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 2px;
          border: 1px solid var(--color-rule);
          background: var(--color-paper);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: var(--color-indigo);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-indigo) 20%, transparent);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="mb-1 block font-medium text-ink">
        {label}
        {required && <span className="text-brick"> *</span>}
      </span>
      {children}
    </label>
  );
}
