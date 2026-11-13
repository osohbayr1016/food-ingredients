import Link from "next/link";
import { RecipeFilters } from "@/components/recipe/RecipeFilters";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { serverGetJson } from "@/lib/serverFetch";
import type { RecipeListItem } from "@/lib/types";
import { Suspense } from "react";

const journeys = [
  { href: "/search", title: "Жор хайх", subtitle: "Нэр эсвэл орцоор хайх", symbol: "search" },
  { href: "/pantry", title: "Орцоороо хоол олох", subtitle: "Хөргөгчиндөө байгааг ашиглах", symbol: "pantry" },
  { href: "/plan", title: "7 хоног төлөвлөх", subtitle: "Хоол болон худалдан авах жагсаалт", symbol: "plan" },
] as const;

function JourneyIcon({ symbol }: { symbol: "search" | "pantry" | "plan" }) {
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {symbol === "search" ? <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></>
      : symbol === "pantry" ? <><rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 11h12M9 6v2M9 14v3"/></>
      : <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15h3"/></>}
  </svg>;
}

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
  const filtered = ["cuisine", "difficulty", "max_cook_time", "tag", "q", "exclude_allergens", "max_calories", "min_protein"].some(k => query.has(k));

  return (
    <main className="space-y-9 pb-12 sm:space-y-12">
      <section className="relative -mx-4 overflow-hidden bg-[#173f30] px-5 py-9 text-white sm:mx-0 sm:rounded-[32px] sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#456e50]/40 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c3e5b2]">Хоол хийхэд амархан</p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.3rem)] font-extrabold leading-[1.12] tracking-tight">Өнөөдөр юу идэх вэ?</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#d7e8da] sm:text-base">
            Жор хай, байгаа орцоороо хоол ол, эсвэл 7 хоногоо төлөвлө.
          </p>
          <form action="/search" method="get" role="search"
            className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.10)]">
            <label htmlFor="food-search" className="sr-only">Хоол, орц хайх</label>
            <svg className="ml-3 shrink-0 text-[#84938a]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4" />
            </svg>
            <input id="food-search" name="q" type="search" maxLength={100}
              placeholder="Жишээ нь: тахианы шөл"
              className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-base text-[#20372b] outline-none placeholder:text-[#7f9086]" />
            <button type="submit" className="min-h-11 shrink-0 rounded-xl bg-[#d6ec83] px-5 text-sm font-bold text-[#20402d] transition hover:bg-[#e3f4a1]">Хайх</button>
          </form>
        </div>
      </section>

      <section aria-labelledby="start-title" className="space-y-4">
        <div>
          <h2 id="start-title" className="text-xl font-bold tracking-tight text-[#203e2c] sm:text-2xl">Юу хийхийг хүсэж байна?</h2>
          <p className="mt-1 text-sm text-[#6f8072]">Гурван энгийн сонголтоос эхлээрэй.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {journeys.map((item, index) => (
            <Link key={item.href} href={item.href}
              className={`group flex min-h-28 items-center gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#276440] sm:min-h-40 sm:flex-col sm:items-start sm:justify-between sm:rounded-3xl sm:p-5 ${index === 1
                ? "border-[#d5e5c8] bg-[#edf6e8]" : "border-[#e3eae0] bg-white"}`}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e0eed7] text-[#286440] sm:h-13 sm:w-13">
                <JourneyIcon symbol={item.symbol}/>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-base font-bold text-[#223e2d]">{item.title}</span>
                <span className="text-xs leading-relaxed text-[#64766a]">{item.subtitle}</span>
              </span>
              <span className="ml-auto text-xl text-[#4c8058] sm:hidden" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recipe-list-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5c8563]">Хоолны санаа</p>
            <h2 id="recipe-list-heading" className="mt-1 text-xl font-bold tracking-tight text-[#203e2c] sm:text-2xl">
              {filtered ? "Таны хайлтад тохирох хоолнууд" : "Шинэ жорууд"}
            </h2>
          </div>
          <Link href="/discover" className="text-sm font-semibold text-[#276440] hover:underline">Бүгдийг үзэх</Link>
        </div>
        <Suspense fallback={<p className="text-sm text-zinc-500">Шүүлтүүр ачаалж байна…</p>}><RecipeFilters /></Suspense>
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

      </section>
      <footer className="rounded-2xl bg-[#f5f6f2] p-5 text-xs leading-relaxed text-zinc-600">
        Хоолны харшил, илчлэг, шим тэжээлийн мэдээллийг баталгаажаагүй жортой холбоотойгоор аюулгүй гэж үзэж болохгүй. Хүнд хэлбэрийн харшилтай бол орц, савлагаа болон бохирдлын эрсдэлийг өөрөө шалгана уу.
      </footer>
    </main>
  );
}
