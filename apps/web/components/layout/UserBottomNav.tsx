"use client";

import { activePrimaryDestination, PRIMARY_DESTINATIONS } from "@/lib/primaryNavigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavIcon({ kind, active }: { kind: "recipes" | "pantry" | "plan"; active: boolean }) {
  const path = kind === "recipes"
    ? <><circle cx="10.5" cy="10.5" r="6.75" /><path d="m15.7 15.7 4.3 4.3" /></>
    : kind === "pantry"
    ? <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M6 11h12M9 6.5v2M9 14v2.5" /></>
    : <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 15h3M14 15h2" /></>;
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>;
}

export function UserBottomNav() {
  const active = activePrimaryDestination(usePathname() ?? "");
  return (
    <nav aria-label="Үндсэн гурван цэс"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e3eae0] bg-white/95 shadow-[0_-6px_24px_rgba(21,61,42,0.07)] backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1 px-3 py-2">
        {PRIMARY_DESTINATIONS.map(item => {
          const selected = active === item.id;
          return <Link key={item.id} href={item.href} aria-current={selected ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#276440] ${selected
              ? "bg-[#edf6e8] text-[#20553a]" : "text-[#718174] hover:bg-[#f5f8f1] hover:text-[#276440]"}`}>
            <NavIcon kind={item.id} active={selected} />
            <span>{item.label}</span>
          </Link>;
        })}
      </div>
    </nav>
  );
}
