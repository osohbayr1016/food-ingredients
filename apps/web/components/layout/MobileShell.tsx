"use client";

import { UserBottomNav } from "@/components/layout/UserBottomNav";
import { activePrimaryDestination, PRIMARY_DESTINATIONS } from "@/lib/primaryNavigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const hideNav = pathname.includes("/cook");
  const active = activePrimaryDestination(pathname);
  return (
    <div className={`min-h-dvh bg-[#fbfcf8] text-[#20372b] ${hideNav ? "pb-[env(safe-area-inset-bottom)]" : "pb-[calc(94px+env(safe-area-inset-bottom))] lg:pb-0"}`}>
      {!hideNav && <header className="sticky top-0 z-30 border-b border-[#e6ebe1] bg-[#fbfcf8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg text-[#1d5137] focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Food Ingredients — Нүүр">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e0efce]" aria-hidden="true">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#276440" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 4c-9 0-16 5-16 13a4 4 0 0 0 4 4c8 0 13-7 12-17Z" />
                <path d="M6 19c3-4 6-7 11-10" />
              </svg>
            </span>
            <span className="truncate text-[15px] font-extrabold tracking-tight sm:text-lg">Food Ingredients</span>
          </Link>
          <nav aria-label="Үндсэн цэс" className="hidden items-center gap-1 rounded-2xl bg-[#eff4eb] p-1 lg:flex">
            {PRIMARY_DESTINATIONS.map(item => <Link key={item.id} href={item.href} aria-current={active === item.id ? "page" : undefined}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${active === item.id
                ? "bg-white text-[#1e5137] shadow-sm" : "text-[#55705d] hover:text-[#1e5137]"}`}>{item.label}</Link>)}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/saved" aria-label="Хадгалсан жорууд" title="Хадгалсан жорууд"
              className="hidden min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#dce8d8] text-[#24543b] hover:bg-[#edf5e8] sm:flex">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z" /></svg>
            </Link>
            <Link href="/profile" aria-label="Миний профайл" title="Миний профайл"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#dce8d8] bg-white text-[#24543b] hover:bg-[#edf5e8]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" /><path d="M5.5 21v-1A6.5 6.5 0 0 1 12 14a6.5 6.5 0 0 1 6.5 6v1" />
              </svg>
            </Link>
          </div>
        </div>
      </header>}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
      {!hideNav && <div className="lg:hidden"><UserBottomNav /></div>}
    </div>
  );
}
