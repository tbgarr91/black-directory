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
  // unverified, rejected, flagged, or null — don't accuse, just note it plainly
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-ink-soft/20 bg-paper-dim px-2 py-0.5 text-xs font-medium text-ink-soft">
      Ownership not yet verified
    </span>
  );
}

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
  if (status === "needs_improvement") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-brick/30 bg-brick-bg px-2 py-0.5 text-xs font-medium text-brick">
        {rating?.toFixed(1)} avg ({count} reviews) · below quality threshold
      </span>
    );
  }
  if (status === "standard" && rating !== null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-ink-soft/30 bg-paper-dim px-2 py-0.5 text-xs font-medium text-ink-soft">
        <StarIcon /> {rating.toFixed(1)} avg ({count} reviews)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-ink-soft/20 bg-paper-dim px-2 py-0.5 text-xs font-medium text-ink-soft">
      Not enough reviews yet{count > 0 ? ` (${count})` : ""}
    </span>
  );
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
