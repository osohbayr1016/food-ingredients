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
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl bg-[#eef6e9] px-1.5 py-3 sm:px-3">
      <div className="hidden text-[#276440] sm:block">{children}</div>
      <div className="line-clamp-2 text-center text-sm font-bold leading-snug text-[#24533a] sm:mt-2">
        {label}
      </div>
      <div className="mt-1 text-center text-[11px] text-[#637968]">{sub}</div>
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
    <div className="flex gap-2 sm:gap-3">
      <StatCard label={prepTime + cookTime > 0 ? `${prepTime + cookTime} мин` : "Тодорхойгүй"} sub="Нийт хугацаа">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </StatCard>
      <StatCard label={`${serves} порц`} sub="Хүний тоо">
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
      <StatCard label={origin} sub="Гарал үүсэл">
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
