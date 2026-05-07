import Link from "next/link";
import { cuisineEmoji } from "@/lib/cuisineEmoji";
import { serverGetJson } from "@/lib/serverFetch";

export default async function CuisinesPage() {
  type Row = { name: string; recipe_count: number };
  const data = await serverGetJson<{ cuisines: Row[] }>(`/cuisines`);
  return (
    <main className="space-y-6 py-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--figma-primary)">
          Categories
        </p>
        <h1 className="text-3xl font-bold text-zinc-900">Cuisines</h1>
      </header>
      <div className="space-y-3">
        {(data.cuisines ?? []).map((row) => (
          <Link
            key={row.name}
            href={`/?cuisine=${encodeURIComponent(row.name)}`}
            className="block touch-manipulation rounded-3xl border border-zinc-100 bg-zinc-50 px-5 py-6 active:bg-zinc-100"
          >
            <div className="flex items-center justify-between">
              <div className="text-4xl">{cuisineEmoji(row.name)}</div>
              <div className="text-sm text-zinc-500">{row.recipe_count}+ recipes</div>
            </div>
            <div className="mt-4 text-lg font-bold text-zinc-900">{row.name}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
