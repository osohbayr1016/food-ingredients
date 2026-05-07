"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primary = "#E23E3E";

function IconHome({ active }: { active: boolean }) {
  const c = active ? primary : "#9CA3AF";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDiscover({ active }: { active: boolean }) {
  const c = active ? primary : "#9CA3AF";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
      <path
        d="M12 7v5l3 2"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBook({ active }: { active: boolean }) {
  const c = active ? primary : "#9CA3AF";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4h9a2 2 0 0 1 2 2v14a1 1 0 0 0-1-1H6a2 2 0 0 0-2 2V6a2 2 0 0 1 2-2z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M18 6h1a2 2 0 0 1 2 2v12" stroke={c} strokeWidth="1.8" />
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  const c = active ? primary : "#9CA3AF";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke={c} strokeWidth="1.8" />
      <path
        d="M5.5 20.5v-1A4.5 4.5 0 0 1 10 15h4a4.5 4.5 0 0 1 4.5 4.5v1"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UserBottomNav() {
  const pathname = usePathname() ?? "";
  const here = (p: string) => pathname === p;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-100 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-xl mx-auto px-2 pt-1">
        <div className="relative flex items-end justify-between gap-0 min-h-[52px] pb-1">
          <Link
            href="/"
            className="flex flex-1 flex-col items-center gap-0.5 pt-1 text-[10px] font-medium touch-manipulation text-zinc-500"
          >
            <IconHome active={here("/")} />
            <span style={{ color: here("/") ? primary : undefined }}>Home</span>
          </Link>
          <Link
            href="/discover"
            className="flex flex-1 flex-col items-center gap-0.5 pt-1 text-[10px] font-medium touch-manipulation text-zinc-500"
          >
            <IconDiscover active={here("/discover")} />
            <span style={{ color: here("/discover") ? primary : undefined }}>
              Discover
            </span>
          </Link>
          <div className="relative flex w-16 shrink-0 flex-col items-center justify-end -mt-7">
            <Link
              href="/suggest"
              aria-label="Match by ingredients"
              className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-light text-white shadow-lg shadow-rose-400/40 touch-manipulation"
              style={{ backgroundColor: primary }}
            >
              +
            </Link>
            <span className="mt-0.5 text-[10px] font-medium text-transparent">
              —
            </span>
          </div>
          <Link
            href="/saved"
            className="flex flex-1 flex-col items-center gap-0.5 pt-1 text-[10px] font-medium touch-manipulation text-zinc-500"
          >
            <IconBook active={here("/saved")} />
            <span style={{ color: here("/saved") ? primary : undefined }}>Saved</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-1 flex-col items-center gap-0.5 pt-1 text-[10px] font-medium touch-manipulation text-zinc-500"
          >
            <IconUser active={here("/profile") || here("/login")} />
            <span style={{ color: here("/profile") || here("/login") ? primary : undefined }}>
              Profile
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
