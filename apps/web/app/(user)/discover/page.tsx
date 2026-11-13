import Link from "next/link";
import { DiscoverOccasionCards } from "@/components/discover/DiscoverOccasionCards";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { serverGetJson } from "@/lib/serverFetch";
import type { RecipeListItem } from "@/lib/types";

export default async function DiscoverPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.min(1000, Math.max(1, Number(params?.page || 1) || 1));
  const [food, cuisinesRes] = await Promise.all([
    serverGetJson<{ recipes: RecipeListItem[]; pagination?: { has_more: boolean } }>(`/recipes?page=${page}`),
    serverGetJson<{ cuisines: { name: string; recipe_count: number }[] }>(`/cuisines`),
  ]);

  return (
    <main className="space-y-7 py-6 pb-12">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4c8058]">Жорын цуглуулга</p>
        <h1 className="text-2xl font-extrabold text-[#203e2c] sm:text-3xl">Бүх жор</h1>
        <p className="text-sm text-[#6e8071]">Сонирхсон хоолоо хайж олоорой.</p>
      </header>
      <Link href="/search" className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#dce7d9] bg-white px-4 text-sm font-semibold text-[#5b7562] shadow-sm">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#447852" strokeWidth="1.9" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>
        </svg>
        Жор эсвэл орц хайх...
      </Link>
      {(cuisinesRes.cuisines ?? []).length > 0 && <section className="space-y-3" aria-labelledby="cuisine-heading">
        <h2 id="cuisine-heading" className="text-base font-bold text-[#203e2c]">Улсын хоол</h2>
        <div className="flex flex-wrap gap-2">
          {(cuisinesRes.cuisines ?? []).slice(0,6).map(row => <Link key={row.name}
            href={`/?cuisine=${encodeURIComponent(row.name)}#recipe-list-heading`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dae8d7] bg-white px-4 text-sm font-semibold text-[#366a45] hover:bg-[#eef6e8]">
            {row.name}
            <span className="text-xs font-medium text-[#849889]">{row.recipe_count}</span>
          </Link>)}
          {cuisinesRes.cuisines.length > 6 && <Link href="/cuisines"
            className="inline-flex min-h-11 items-center rounded-full bg-[#eaf4e5] px-4 text-sm font-semibold text-[#276440]">Бусад ангилал</Link>}
        </div>
      </section>}
      <details className="rounded-2xl border border-[#e2e9df] bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#356846]">Тохиолдлоор хоол сонгох</summary>
        <div className="pt-4"><DiscoverOccasionCards/></div>
      </details>
      <section className="space-y-4" aria-labelledby="latest-recipe-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="latest-recipe-title" className="text-xl font-bold text-[#203e2c]">Сүүлд нэмэгдсэн жорууд</h2>
          <Link href="/pantry" className="text-xs font-bold text-[#276440] underline underline-offset-4">
            Миний орцоор
          </Link>
        </div>
        {food.recipes.length ? <RecipeGrid recipes={food.recipes}/> :
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#728276]">Одоогоор жор байхгүй байна.</p>}
        <nav aria-label="Жорын хуудас" className="flex items-center justify-center gap-3 py-3 text-sm font-semibold">
          {page > 1 && <Link href={`/discover?page=${page-1}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-[#dce7d9] px-4 text-[#276440]">Өмнөх</Link>}
          <span className="text-xs text-[#657e6e]">{page}-р хуудас</span>
          {food.pagination?.has_more && <Link href={`/discover?page=${page+1}`}
            className="inline-flex min-h-11 items-center rounded-xl bg-[#276440] px-4 text-white">Дараагийн жорууд</Link>}
        </nav>
      </section>
    </main>
  );
}
