"use client";

import { useEffect, useState } from "react";

function buildMapsUrl(query: string, isIOS: boolean) {
  const encoded = encodeURIComponent(query);
  return isIOS
    ? `https://maps.apple.com/?q=${encoded}`
    : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

export function MapsLink({
  query,
  children,
  className,
}: {
  query: string;
  children: React.ReactNode;
  className?: string;
}) {
  // Default to a universal Google Maps link for the server-rendered pass,
  // then switch to Apple Maps on mount if the device looks like iOS.
  const [href, setHref] = useState(() => buildMapsUrl(query, false));

  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setHref(buildMapsUrl(query, isIOS));
  }, [query]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
