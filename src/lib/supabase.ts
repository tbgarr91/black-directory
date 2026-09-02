import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---- Types matching the database schema ----

export type OwnershipStatus =
  | "unverified"
  | "pending_review"
  | "verified"
  | "rejected"
  | "flagged";

export type QualityStatus =
  | "insufficient_data"
  | "needs_improvement"
  | "standard"
  | "quality_verified";

export interface BusinessSearchResult {
  business_id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  state_region: string | null;
  country: string | null;
  is_online_only: boolean;
  status: string;
  ownership_status: OwnershipStatus | null;
  quality_status: QualityStatus | null;
  average_rating: string | null;
  review_count: number | null;
  categories: string[] | null;
}

export interface Category {
  category_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
}

export interface ReferenceBrand {
  reference_brand_id: string;
  name: string;
  category_id: string | null;
}

export interface Review {
  review_id: string;
  business_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  status: string;
}
