import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-2xl tracking-tight text-ink">
          The Ledger
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/search" className="text-ink-soft hover:text-ink transition-colors">
            Browse
          </Link>
          <Link
            href="/submit"
            className="rounded-sm bg-indigo px-3.5 py-1.5 text-paper hover:bg-indigo-dim transition-colors"
          >
            List your business
          </Link>
        </nav>
      </div>
    </header>
  );
}
