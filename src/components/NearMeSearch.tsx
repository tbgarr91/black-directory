"use client";

import { useState } from "react";
import { supabase, type BusinessSearchResult } from "@/lib/supabase";
import { BusinessListing } from "./BusinessListing";

type NearbyResult = BusinessSearchResult & { distance_meters: number };

export function NearMeSearch() {
  const [status, setStatus] = useState<"idle" | "locating" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [results, setResults] = useState<NearbyResult[]>([]);

  function handleClick() {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Your browser doesn't support location search.");
      return;
    }

    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("loading");
        const { latitude, longitude } = position.coords;

        const { data, error } = await supabase.rpc("nearby_businesses", {
          p_lat: latitude,
          p_lng: longitude,
          p_radius_meters: 40000, // ~25 miles
          p_limit: 30,
        });

        if (error) {
          setStatus("error");
          setErrorMsg("Something went wrong finding nearby businesses.");
          return;
        }

        setResults(data ?? []);
        setStatus("done");
      },
      () => {
        setStatus("error");
        setErrorMsg("Location access was denied. You can still search by name or category above.");
      }
    );
  }

  return (
    <div>
      {status !== "done" && (
        <button
          onClick={handleClick}
          disabled={status === "locating" || status === "loading"}
          className="rounded-sm border border-rule px-4 py-2 text-sm font-medium text-ink-soft hover:border-indigo hover:text-indigo transition-colors disabled:opacity-60"
        >
          {status === "locating"
            ? "Getting your location…"
            : status === "loading"
            ? "Searching nearby…"
            : "📍 Find businesses near me"}
        </button>
      )}

      {status === "error" && <p className="mt-2 text-sm text-brick">{errorMsg}</p>}

      {status === "done" && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Near you</h2>
            <button
              onClick={() => setStatus("idle")}
              className="text-sm text-indigo underline"
            >
              Search again
            </button>
          </div>
          {results.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              Nothing within about 25 miles yet. As more businesses get added with
              addresses, this will fill in.
            </p>
          ) : (
            <div className="mt-4">
              {results.map((b) => {
                const miles = (b.distance_meters / 1609.34).toFixed(1);
                return (
                  <div key={b.business_id}>
                    <BusinessListing business={b} />
                    <p className="-mt-4 mb-4 text-xs text-ink-soft">{miles} mi away</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
