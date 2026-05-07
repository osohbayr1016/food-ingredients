import Link from "next/link";

export function HomeHeader() {
  return (
    <header className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-(--figma-primary)">
          Food Ingredients
        </p>
        <h1 className="text-xl font-bold text-zinc-900">Home</h1>
      </div>
      <Link
        href="/search"
        className="flex h-11 w-full items-center gap-3 rounded-full border border-rose-100 bg-zinc-50 px-4 text-sm text-zinc-500 touch-manipulation"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-zinc-400" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Search recipes
      </Link>
    </header>
  );
}
