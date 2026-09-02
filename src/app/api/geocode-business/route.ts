import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { geocodeAddress } from "@/lib/geocode";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const { businessId, address, city, stateRegion } = await req.json();

  if (!businessId) {
    return NextResponse.json({ success: false, error: "Missing business ID." }, { status: 400 });
  }

  const queryParts = [address, city, stateRegion, "USA"].filter(Boolean);
  if (queryParts.length === 0) {
    return NextResponse.json({ success: false, error: "No address information to geocode." }, { status: 400 });
  }

  const coords = await geocodeAddress(queryParts.join(", "));
  if (!coords) {
    return NextResponse.json({ success: false, error: "Could not find coordinates for that address." }, { status: 404 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.rpc("set_business_geo_location", {
    p_business_id: businessId,
    p_lat: coords.lat,
    p_lng: coords.lng,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, lat: coords.lat, lng: coords.lng });
}
