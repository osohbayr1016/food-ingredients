import Link from "next/link";

export function HomeHeader() {
  return (
    <header className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-(--figma-primary)">
          Food Ingredients
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Home</h1>
      </div>
      <Link
        href="/search"
        className="flex h-14 w-full items-center gap-3 rounded-full border border-zinc-100 bg-white px-6 shadow-sm transition-all hover:border-rose-200 hover:shadow-md touch-manipulation"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-zinc-400" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-base text-zinc-500">Search recipes</span>
      </Link>
    </header>
  );
}
