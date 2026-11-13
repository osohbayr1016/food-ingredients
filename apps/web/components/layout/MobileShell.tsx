"use client";

import { UserBottomNav } from "@/components/layout/UserBottomNav";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const hideNav = pathname.includes("/cook");
  return (
    <div className={`min-h-dvh bg-[#fcfdf9] text-[#21362b] ${hideNav ? "pb-[env(safe-area-inset-bottom)]" : "pb-[calc(92px+env(safe-area-inset-bottom))] md:pb-0"}`}>
      {!hideNav && (
        <header className="sticky top-0 z-30 border-b border-[#e7eee4] bg-[#fcfdf9]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-[#204932]">
              <span aria-hidden className="text-2xl">🍃</span> Food Ingredients
            </Link>
            <nav aria-label="Үндсэн цэс" className="hidden items-center gap-7 text-sm font-semibold text-[#476251] md:flex">
              <Link href="/" className="hover:text-[#153d29]">Нүүр</Link>
              <Link href="/discover" className="hover:text-[#153d29]">Жорууд</Link>
              <Link href="/suggest" className="hover:text-[#153d29]">Миний орц</Link>
              <Link href="/saved" className="hover:text-[#153d29]">Хадгалсан</Link>
              <Link href="/profile" className="hover:text-[#153d29]">Профайл</Link>
            </nav>
            <Link href="/search" className="rounded-full border border-[#dbe8d9] px-3 py-2 text-xs font-semibold text-[#204932] md:px-5 md:text-sm">
              Хайх
            </Link>
          </div>
        </header>
      )}
      <div className="mx-auto max-w-6xl px-4 pt-[env(safe-area-inset-top)]">{children}</div>
      {!hideNav && <div className="md:hidden"><UserBottomNav /></div>}
    </div>
  );
}
