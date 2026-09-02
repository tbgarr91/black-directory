import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "For The Record — Verified Black-Owned Businesses",
  description:
    "Find a Black-owned business, or a Black-owned alternative to a brand you already use. Every listing carries two independent marks: ownership verified, and quality verified — separately, for the record.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..700,0..100,0..1&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
