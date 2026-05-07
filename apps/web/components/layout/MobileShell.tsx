"use client";

import { UserBottomNav } from "@/components/layout/UserBottomNav";
import { usePathname } from "next/navigation";

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const hideNav = pathname.includes("/cook");
  return (
    <div
      className={`min-h-dvh bg-white text-zinc-900 ${
        hideNav
          ? "pb-[env(safe-area-inset-bottom)]"
          : "pb-[calc(92px+env(safe-area-inset-bottom))]"
      }`}
    >
      <div className="max-w-xl mx-auto px-4 pt-[env(safe-area-inset-top)]">{children}</div>
      {!hideNav && <UserBottomNav />}
    </div>
  );
}
