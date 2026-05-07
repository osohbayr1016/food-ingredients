import { Suspense } from "react";
import Link from "next/link";
import { CategoryPills } from "@/components/home/CategoryPills";
import { HomeHeader } from "@/components/home/HomeHeader";
import { RecipeFilters } from "@/components/recipe/RecipeFilters";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { serverGetJson } from "@/lib/serverFetch";
import type { RecipeListItem } from "@/lib/types";

function pick(
  input: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  if (!input) return undefined;
  const v = input[key];
  return typeof v === "string" ? v : undefined;
}

export default async function HomePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const qp = new URLSearchParams();
  for (const k of ["cuisine", "difficulty", "max_cook_time", "tag", "q"] as const) {
    const v = pick(sp, k);
    if (v) qp.set(k, v);
  }
  const tail = qp.toString();
  const [payload, cuisinesRes] = await Promise.all([
    serverGetJson<{ recipes: RecipeListItem[] }>(tail ? `/recipes?${tail}` : `/recipes`),
    serverGetJson<{ cuisines: { name: string; recipe_count: number }[] }>(`/cuisines`),
  ]);

  return (
    <main className="space-y-5 py-5">
      <HomeHeader />
      <CategoryPills cuisines={cuisinesRes.cuisines ?? []} />
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-lg font-bold text-zinc-900">Most popular</h2>
          <Link href="/discover" className="text-xs font-semibold text-(--figma-primary) touch-manipulation">
            See all
          </Link>
        </div>
        {!payload.recipes.length ? (
          <p className="text-sm text-zinc-500">No recipes match your filters.</p>
        ) : (
          <RecipeGrid recipes={payload.recipes} />
        )}
      </section>
      <details className="rounded-2xl border border-zinc-100 bg-zinc-50/80 px-3 py-2">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
          Filters
        </summary>
        <div className="pt-3">
          <Suspense
            fallback={<p className="text-sm text-zinc-500">Loading filters…</p>}
          >
            <RecipeFilters />
          </Suspense>
        </div>
      </details>
    </main>
  );
}
