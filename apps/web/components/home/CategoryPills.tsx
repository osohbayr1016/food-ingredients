import Link from "next/link";

export function CategoryPills({
  cuisines,
}: {
  cuisines: { name: string; recipe_count: number }[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-zinc-900">Categories</h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {cuisines.map((c) => (
          <Link
            key={c.name}
            href={`/?cuisine=${encodeURIComponent(c.name)}`}
            className="shrink-0 rounded-full border border-zinc-100 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md touch-manipulation active:bg-zinc-50"
          >
            {c.name}
            <span className="ml-1.5 text-zinc-400 font-medium">({c.recipe_count})</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
