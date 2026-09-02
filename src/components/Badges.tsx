import type { OwnershipStatus, QualityStatus } from "@/lib/supabase";

export function OwnershipBadge({ status }: { status: OwnershipStatus | null }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-forest/30 bg-forest-bg px-2 py-0.5 text-xs font-medium text-forest">
        <CheckIcon /> Black-owned, verified
      </span>
    );
  }
  if (status === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-ink-soft/30 bg-paper-dim px-2 py-0.5 text-xs font-medium text-ink-soft">
        Ownership under review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-ink-soft/20 bg-paper-dim px-2 py-0.5 text-xs font-medium text-ink-soft">
      Ownership not yet verified
    </span>
  );
}

// Quality is shown with a single positive signal: the gold "Quality verified"
// badge appears only once a business has enough reviews and a strong average.
// Its ABSENCE is the signal for everything else — we don't call out low
// ratings or "below threshold" businesses with special negative styling;
// we just show the plain rating (or "no reviews yet") with no judgment.
export function QualityBadge({
  status,
  averageRating,
  reviewCount,
}: {
  status: QualityStatus | null;
  averageRating: string | null;
  reviewCount: number | null;
}) {
  const count = reviewCount ?? 0;
  const rating = averageRating ? parseFloat(averageRating) : null;

  if (status === "quality_verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-gold/40 bg-gold-bg px-2 py-0.5 text-xs font-medium text-gold">
        <StarIcon /> Quality verified · {rating?.toFixed(1)} ({count} reviews)
      </span>
    );
  }

  if (rating !== null && count > 0) {
    return (
      <span className="text-xs text-ink-soft">
        {rating.toFixed(1)} avg ({count} review{count === 1 ? "" : "s"})
      </span>
    );
  }

  return <span className="text-xs text-ink-soft">No reviews yet</span>;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M6 0.5l1.545 3.13 3.455.502-2.5 2.437.59 3.44L6 8.4l-3.09 1.625.59-3.44-2.5-2.437 3.455-.503L6 0.5z" />
    </svg>
  );
}
