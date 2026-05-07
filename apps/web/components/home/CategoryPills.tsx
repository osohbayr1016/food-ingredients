import Link from "next/link";

export function CategoryPills({
  cuisines,
}: {
  cuisines: { name: string; recipe_count: number }[];
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-bold text-zinc-900">Categories</h2>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {cuisines.map((c) => (
          <Link
            key={c.name}
            href={`/?cuisine=${encodeURIComponent(c.name)}`}
            className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 touch-manipulation active:bg-zinc-50"
          >
            {c.name}
            <span className="ml-1 text-zinc-400">({c.recipe_count})</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
