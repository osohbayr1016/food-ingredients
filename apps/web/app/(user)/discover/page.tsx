import Link from "next/link";
import { cuisineEmoji } from "@/lib/cuisineEmoji";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { serverGetJson } from "@/lib/serverFetch";
import type { RecipeListItem } from "@/lib/types";

export default async function DiscoverPage() {
  const [food, cuisinesRes] = await Promise.all([
    serverGetJson<{ recipes: RecipeListItem[] }>(`/recipes`),
    serverGetJson<{ cuisines: { name: string; recipe_count: number }[] }>(`/cuisines`),
  ]);

  return (
    <main className="space-y-6 py-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--figma-primary)">
          Discover
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">Explore</h1>
        <p className="text-sm text-zinc-500">Browse cuisines and trending recipes.</p>
      </header>
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-900">Recipe categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {(cuisinesRes.cuisines ?? []).slice(0, 6).map((row) => (
            <Link
              key={row.name}
              href={`/?cuisine=${encodeURIComponent(row.name)}`}
              className="relative overflow-hidden rounded-3xl bg-zinc-100 p-4 touch-manipulation active:scale-[0.99]"
            >
              <div className="text-3xl">{cuisineEmoji(row.name)}</div>
              <p className="mt-3 text-sm font-bold text-zinc-900">{row.name}</p>
              <p className="text-xs text-zinc-500">{row.recipe_count}+ recipes</p>
            </Link>
          ))}
        </div>
        <Link
          href="/cuisines"
          className="block text-center text-sm font-semibold text-(--figma-primary)"
        >
          All categories →
        </Link>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Most popular</h2>
          <Link href="/search" className="text-xs font-semibold text-(--figma-primary)">
            Search
          </Link>
        </div>
        <RecipeGrid recipes={food.recipes} />
      </section>
    </main>
  );
}
