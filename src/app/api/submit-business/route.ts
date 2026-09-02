import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    description,
    tagline,
    website,
    email,
    city,
    stateRegion,
    isOnlineOnly,
    categoryId,
    referralNote,
    honeypot, // hidden field — real users never fill this in
    formLoadedAt, // timestamp (ms) from when the form rendered
  } = body;

  // Honeypot tripped: pretend success so the bot doesn't learn anything,
  // but silently skip the actual insert.
  if (honeypot) {
    return NextResponse.json({ success: true });
  }

  // Submitted implausibly fast for a multi-field form — likely scripted.
  if (typeof formLoadedAt === "number" && Date.now() - formLoadedAt < 3000) {
    return NextResponse.json(
      { success: false, error: "Please take a moment before submitting." },
      { status: 400 }
    );
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ success: false, error: "Business name is required." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Rate limit by hashed IP (never store the raw IP).
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

  const { data: allowed, error: rateLimitError } = await supabase.rpc("check_and_log_submission", {
    p_ip_hash: ipHash,
    p_max_per_day: 5,
  });

  if (rateLimitError) {
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Too many submissions from this network today. Please try again tomorrow." },
      { status: 429 }
    );
  }

  const businessId = crypto.randomUUID();
  const slug = slugify(name);

  const { error: businessError } = await supabase.from("businesses").insert({
    business_id: businessId,
    name: name.trim(),
    slug,
    description: description || null,
    short_tagline: tagline || null,
    website_url: website || null,
    email: email || null,
    city: isOnlineOnly ? null : city || null,
    state_region: isOnlineOnly ? null : stateRegion || null,
    is_online_only: Boolean(isOnlineOnly),
    source_type: "self_submitted",
    status: "pending",
    referral_note: referralNote || null,
  });

  if (businessError) {
    return NextResponse.json({ success: false, error: businessError.message }, { status: 400 });
  }

  if (categoryId) {
    await supabase.from("business_categories").insert({
      business_id: businessId,
      category_id: categoryId,
      is_primary: true,
    });
  }

  return NextResponse.json({ success: true });
}
