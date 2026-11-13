"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PantryFabButton() {
  const active = (usePathname() ?? "").startsWith("/pantry");
  return (
    <Link href="/pantry" aria-label="Миний хөргөгчийг нээх"
      aria-current={active ? "page" : undefined}
      className="flex h-14 w-14 items-center justify-center rounded-full bg-[#276440] text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#1f5134] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#276440]">
      <svg width="27" height="27" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M6 11h12M9 6.5v2M9 14v2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    </Link>
  );
}