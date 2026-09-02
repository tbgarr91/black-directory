// Geocodes a plain-text address into { lat, lng } using OpenStreetMap's free
// Nominatim service. No API key required, but their usage policy asks for
// a descriptive User-Agent and no more than ~1 request/second — fine for
// this app's current volume. If usage grows significantly, consider a paid
// geocoder (Google/Mapbox) for better rate limits and accuracy.
//
// This must run server-side only (never in the browser): browsers control
// the User-Agent header themselves, so a client-side fetch can't identify
// the app the way Nominatim's policy expects.

export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!query || !query.trim()) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ForTheRecordApp/1.0 (Black-owned business directory)",
      },
    });
    if (!res.ok) return null;

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const { lat, lon } = results[0];
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lon);
    if (isNaN(latNum) || isNaN(lngNum)) return null;

    return { lat: latNum, lng: lngNum };
  } catch {
    return null; // geocoding is best-effort — never block the caller on failure
  }
}
