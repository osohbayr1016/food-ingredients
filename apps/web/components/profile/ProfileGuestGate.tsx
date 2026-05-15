"use client";

import Link from "next/link";

export function ProfileGuestGate() {
  return (
    <main className="flex flex-col items-center space-y-6 py-14 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-(--figma-soft) text-sm font-semibold text-zinc-500">
        ?
      </div>
      <div className="max-w-xs space-y-2">
        <h1 className="text-xl font-bold text-zinc-900">Профайл</h1>
        <p className="text-sm text-zinc-600">
          Жор үзэхэд нэвтрэх шаардлагагүй. Хадгалах, дуртай, тогооны түүхийн тулд нэвтэрнэ үү.
        </p>
      </div>
      <Link
        href="/login"
        className="w-full max-w-[280px] rounded-full bg-(--figma-primary) py-3.5 text-sm font-semibold text-white touch-manipulation"
      >
        Нэвтрэх
      </Link>
      <Link
        href="/signup"
        className="text-sm font-semibold text-(--figma-primary) touch-manipulation"
      >
        Шинээр бүртгүүлэх
      </Link>
    </main>
  );
}
