import Link from "next/link";
import { MEAL_OCCASION_IDEAS } from "@/lib/mealOccasionIdeas";

export function DiscoverOccasionCards() {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-bold text-zinc-900">Оройн ба баярын ангилал</h2>
        <p className="text-xs text-zinc-500">Нэг товшилтоор тохирсон жоруудыг нээгээрэй.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {MEAL_OCCASION_IDEAS.map((o) => (
          <Link
            key={o.tagName}
            href={`/?tag=${encodeURIComponent(o.tagName)}`}
            title={o.subtitle}
            className="rounded-3xl border border-zinc-200 bg-white p-4 touch-manipulation active:scale-[0.99]"
          >
            <div className="text-3xl">{o.emoji}</div>
            <p className="mt-2 text-sm font-bold leading-snug text-zinc-900">{o.tagName}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
