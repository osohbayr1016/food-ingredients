import Link from "next/link";
import { MEAL_OCCASION_IDEAS } from "@/lib/mealOccasionIdeas";

export function MealOccasionPills() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-zinc-900">Оройн ба баярын санаа</h2>
      <p className="text-sm text-zinc-500">
        Найр, үндэсний баяр, наадам, цагаан сар — олон хүнд зориулсан хоолны санаа.
      </p>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {MEAL_OCCASION_IDEAS.map((o) => (
          <Link
            key={o.tagName}
            title={o.subtitle}
            href={`/?tag=${encodeURIComponent(o.tagName)}`}
            className="flex min-w-[10rem] shrink-0 flex-col gap-1 rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md touch-manipulation active:bg-zinc-50"
          >
            <span className="text-2xl leading-none">{o.emoji}</span>
            <span className="line-clamp-2 leading-snug">{o.tagName}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
