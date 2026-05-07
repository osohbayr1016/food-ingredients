"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminSecretProvider, useAdminSecret } from "./AdminSecretContext";

function AdminChromeInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { adminSecret, setAdminSecret } = useAdminSecret();
  const importActive = pathname === "/admin";
  const recipesActive = pathname.startsWith("/admin/recipes");

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <span className="font-semibold text-zinc-900">Админ</span>
          <nav className="flex gap-4 text-sm font-medium">
            <Link
              href="/admin"
              className={
                importActive ? "text-[#E23E3E]" : "text-zinc-600 hover:text-zinc-900"
              }
            >
              Импорт
            </Link>
            <Link
              href="/admin/recipes"
              className={
                recipesActive ? "text-[#E23E3E]" : "text-zinc-600 hover:text-zinc-900"
              }
            >
              Жорын удирдлага
            </Link>
          </nav>
          <label className="ml-auto flex min-w-[200px] flex-1 flex-col gap-0.5 sm:max-w-xs">
            <span className="text-xs text-zinc-500">ADMIN нууц</span>
            <input
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              autoComplete="off"
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-red-400"
            />
          </label>
        </div>
      </header>
      {children}
    </>
  );
}

export function AdminChrome({ children }: { children: ReactNode }) {
  return (
    <AdminSecretProvider>
      <AdminChromeInner>{children}</AdminChromeInner>
    </AdminSecretProvider>
  );
}
