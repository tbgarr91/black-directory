import Link from "next/link";
import type { BusinessSearchResult } from "@/lib/supabase";
import { OwnershipBadge, QualityBadge } from "./Badges";

export function BusinessListing({ business }: { business: BusinessSearchResult }) {
  const location = business.is_online_only
    ? "Online / ships nationwide"
    : [business.city, business.state_region].filter(Boolean).join(", ") || null;

  return (
    <Link
      href={`/business/${business.slug}`}
      className="group flex flex-col gap-2 border-b border-rule py-6 first:pt-0 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h3 className="font-display text-xl text-ink group-hover:text-indigo transition-colors">
            {business.name}
          </h3>
          {location && (
            <span className="text-sm text-ink-soft">{location}</span>
          )}
        </div>
        {business.description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {business.description}
          </p>
        )}
        {business.categories && business.categories.filter(Boolean).length > 0 && (
          <p className="mt-2 text-xs uppercase tracking-wide text-ink-soft/70">
            {business.categories.filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-row flex-wrap gap-2 sm:flex-col sm:items-end">
        <OwnershipBadge status={business.ownership_status} />
        <QualityBadge
          status={business.quality_status}
          averageRating={business.average_rating}
          reviewCount={business.review_count}
        />
      </div>
    </Link>
  );
}
