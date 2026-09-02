import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OwnershipBadge, QualityBadge } from "@/components/Badges";
import { ReviewForm } from "@/components/ReviewForm";
import { MapsLink } from "@/components/MapsLink";
import { FavoriteButton } from "@/components/FavoriteButton";
import { supabase, type BusinessSearchResult, type Review } from "@/lib/supabase";

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

async function getBusiness(slug: string): Promise<BusinessSearchResult | null> {
  const { data } = await supabase
    .from("business_search_view")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

async function getReviews(businessId: string): Promise<Review[]> {
  const { data } = await supabase
    .from("reviews")
    .select("review_id, business_id, rating, title, body, created_at, status")
    .eq("business_id", businessId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) notFound();

  const reviews = await getReviews(business.business_id);

  const location = business.is_online_only
    ? "Online / ships nationwide"
    : [business.city, business.state_region].filter(Boolean).join(", ") || null;

  // Query used to open the person's native maps app — name + city/state is
  // the best we have since we don't collect a full street address.
  const mapsQuery = business.address_line1
    ? [business.address_line1, business.city, business.state_region].filter(Boolean).join(", ")
    : [business.name, business.city, business.state_region].filter(Boolean).join(", ");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-4xl text-ink">{business.name}</h1>
          <FavoriteButton businessId={business.business_id} />
        </div>

        {location && (
          <p className="mt-2 text-ink-soft">
            {business.is_online_only ? (
              location
            ) : (
              <MapsLink query={mapsQuery} className="underline decoration-dotted hover:text-indigo">
                {location}
              </MapsLink>
            )}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <OwnershipBadge status={business.ownership_status} />
          <QualityBadge
            status={business.quality_status}
            averageRating={business.average_rating}
            reviewCount={business.review_count}
          />
        </div>

        {business.description && (
          <p className="mt-6 max-w-xl leading-relaxed text-ink">
            {business.description}
          </p>
        )}

        {business.categories && business.categories.filter(Boolean).length > 0 && (
          <p className="mt-4 text-xs uppercase tracking-wide text-ink-soft/70">
            {business.categories.filter(Boolean).join(" · ")}
          </p>
        )}

        <section className="mt-14">
          <h2 className="font-display text-xl text-ink">Reviews</h2>
          <div className="mt-4">
            {reviews.length === 0 ? (
              <p className="text-ink-soft">No published reviews yet — be the first.</p>
            ) : (
              <ul className="flex flex-col gap-5">
                {reviews.map((r) => (
                  <li key={r.review_id} className="border-b border-rule pb-5 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gold">
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </span>
                      {r.title && <span className="text-sm font-medium text-ink">{r.title}</span>}
                    </div>
                    {r.body && <p className="mt-1 text-sm text-ink-soft">{r.body}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8 border-t border-rule pt-8">
            <h3 className="font-display text-lg text-ink">Leave a review</h3>
            <p className="mt-1 mb-4 text-sm text-ink-soft">
              Reviews are moderated before they count toward this business's rating. You don't need an account to leave one.
            </p>
            <ReviewForm businessId={business.business_id} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
