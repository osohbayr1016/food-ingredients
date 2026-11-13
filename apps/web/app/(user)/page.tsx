import Link from "next/link";
import { RecipeFilters } from "@/components/recipe/RecipeFilters";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { serverGetJson } from "@/lib/serverFetch";
import type { RecipeListItem } from "@/lib/types";
import { Suspense } from "react";

const journeys = [
  { href: "/suggest", icon: "🥕", title: "Байгаа орцоороо", detail: "Хөргөгчинд байгаа зүйлээрээ хоол олох", color: "bg-[#eef4e7]" },
  { href: "/?max_cook_time=30", icon: "⏱", title: "Хурдан хоол", detail: "30 минут болон түүнээс бага", color: "bg-[#fff3df]" },
  { href: "/discover", icon: "🍲", title: "Шинэ жор", detail: "Дэлхийн хоолны санаанууд", color: "bg-[#f7eae5]" },
  { href: "/profile", icon: "🎯", title: "Миний зорилго", detail: "Хооллолтын зорилгоо тохируулах", color: "bg-[#eaeafa]" },
  { href: "/plan", icon: "📅", title: "7 хоногийн план", detail: "Хоол болон авах орцын жагсаалт", color: "bg-[#e7f4ef]" },
];

function getParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];
  return typeof value === "string" ? value : undefined;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["cuisine", "difficulty", "max_cook_time", "tag", "q", "exclude_allergens", "max_calories", "min_protein"]) {
    const value = getParam(params, key);
    if (value) query.set(key, value);
  }
  const currentPage = Math.min(1000, Math.max(1, Number(getParam(params, "page") || 1) || 1));
  if (currentPage > 1) query.set("page", String(currentPage));
  const suffix = query.toString();
  const { recipes, pagination } = await serverGetJson<{ recipes: RecipeListItem[]; pagination?: { has_more: boolean } }>(
    suffix ? `/recipes?${suffix}` : "/recipes",
  );
  const filtered = suffix.length > 0;

  return (
    <main className="space-y-10 pb-12">
      <section className="relative -mx-4 overflow-hidden bg-[#173f30] px-5 pb-9 pt-8 text-white sm:mx-0 sm:rounded-[32px] sm:px-9 sm:py-12">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-[#407553]/50 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold tracking-wide text-[#d5edcd]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#b6d879]" />
            FOOD INGREDIENTS
          </div>
          <h1 className="max-w-xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
            Өнөөдөр ямар хоол хийх вэ?
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#d6e4db]">
            Орц, зав, дуртай амтаа сонго. Бид хийхэд ойлгомжтой жорыг олоход тусална.
          </p>
          <form action="/search" method="get" className="mt-7 flex w-full max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-lg">
            <label className="sr-only" htmlFor="food-search">Хоол хайх</label>
            <input
              id="food-search"
              name="q"
              placeholder="Хоол, орц эсвэл амт хайх..."
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
            />
            <button type="submit" className="shrink-0 rounded-xl bg-[#d8ef83] px-5 py-3 text-sm font-bold text-[#193e2e] transition hover:bg-[#c8e36c]">
              Хайх
            </button>
          </form>
          <Link href="/suggest" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#d8ef83] underline-offset-4 hover:underline">
            Надад байгаа орцоор юу хийж болох вэ? <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="start-title">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c7a53]">Танд зориулсан</p>
          <h2 id="start-title" className="mt-1 text-2xl font-bold tracking-tight">Хаанаас эхлэх вэ?</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {journeys.map((item) => (
            <Link key={item.href} href={item.href} className={`group flex min-h-40 flex-col rounded-3xl p-5 transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#40834c] ${item.color}`}>
              <span className="text-3xl" aria-hidden>{item.icon}</span>
              <span className="mt-5 text-base font-bold text-[#22372b]">{item.title}</span>
              <span className="mt-1 text-xs leading-relaxed text-[#55665a]">{item.detail}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e4eadd] bg-[#f8faf4] p-6 sm:p-8">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#608a59]">Миний хөргөгч</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#203b2d]">Орцоо бичээд, тохирох хоолоо олоорой</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5d6c60]">Өндөг, төмс, лууван, тахиа... Хэрэглэхэд хялбар орцын тохирлын систем аль хэдийн ажиллаж байна.</p>
          </div>
          <Link href="/suggest" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#24563b] px-6 text-sm font-bold text-white hover:bg-[#173f30]">
            Орц сонгох →
          </Link>
        </div>
      </section>

      <section aria-labelledby="recipe-list-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4c7a53]">Хоолны цуглуулга</p>
            <h2 id="recipe-list-heading" className="mt-1 text-2xl font-bold tracking-tight">
              {filtered ? "Таны хайлтад тохирох хоолнууд" : "Сүүлд нэмэгдсэн жорууд"}
            </h2>
          </div>
          <Link href="/discover" className="text-sm font-semibold text-[#276440] hover:underline">Бүгдийг үзэх →</Link>
        </div>
        {recipes.length ? (
          <RecipeGrid recipes={recipes} />
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-300 px-6 py-12 text-center">
            <p className="font-semibold">Одоогоор тохирох жор алга.</p>
            <p className="mt-2 text-sm text-zinc-500">Өөр орц, эсвэл хайлтын нөхцөл сонгоорой.</p>
            <Link href="/" className="mt-4 inline-block text-sm font-bold text-[#276440] underline">Шүүлтүүр арилгах</Link>
          </div>
        )}
        <nav aria-label="Жорын хуудас" className="flex items-center justify-center gap-4 text-sm font-semibold">
          {currentPage > 1 && <Link href={`/?${new URLSearchParams({ ...Object.fromEntries(query.entries()), page: String(currentPage - 1) })}`}
            className="rounded-xl border border-[#dce7d9] px-5 py-3 text-[#28613e]">← Өмнөх</Link>}
          <span className="text-zinc-500">{currentPage}-р хуудас</span>
          {pagination?.has_more && <Link href={`/?${new URLSearchParams({ ...Object.fromEntries(query.entries()), page: String(currentPage + 1) })}`}
            className="rounded-xl bg-[#28613e] px-5 py-3 text-white">Дараагийн →</Link>}
        </nav>
        <details className="rounded-2xl border border-[#dfe8db] bg-white px-5 py-4">
          <summary className="cursor-pointer text-sm font-bold text-[#254a34]">Илүү нарийн шүүх</summary>
          <div className="pt-4"><Suspense fallback={<p>Шүүлтүүр ачаалж байна…</p>}><RecipeFilters /></Suspense></div>
        </details>
      </section>
      <footer className="rounded-2xl bg-[#f5f6f2] p-5 text-xs leading-relaxed text-zinc-600">
        Хоолны харшил, илчлэг, шим тэжээлийн мэдээллийг баталгаажаагүй жортой холбоотойгоор аюулгүй гэж үзэж болохгүй. Хүнд хэлбэрийн харшилтай бол орц, савлагаа болон бохирдлын эрсдэлийг өөрөө шалгана уу.
      </footer>
    </main>
  );
}
