"use client";

function StatCard({
  label,
  sub,
  children,
}: {
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-[31%] flex-1 flex-col items-center rounded-2xl bg-(--figma-soft) px-3 py-3">
      <div className="text-(--figma-primary)">{children}</div>
      <div className="mt-2 text-center text-sm font-semibold leading-tight text-(--figma-primary)">
        {label}
      </div>
      <div className="text-center text-[10px] text-zinc-500">{sub}</div>
    </div>
  );
}

export function RecipeDetailStatRow({
  prepTime,
  cookTime,
  serves,
  origin,
}: {
  prepTime: number;
  cookTime: number;
  serves: number;
  origin: string;
}) {
  return (
    <div className="flex gap-2">
      <StatCard label={`${prepTime + cookTime} min`} sub="cook time">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </StatCard>
      <StatCard label={`${serves} serving${serves > 1 ? "s" : ""}`} sub="serves">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M5.5 20.5v-1A4.5 4.5 0 0 1 10 15h4a4.5 4.5 0 0 1 4.5 4.5v1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </StatCard>
      <StatCard label={origin} sub="origin">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2" fill="currentColor" />
        </svg>
      </StatCard>
    </div>
  );
}
