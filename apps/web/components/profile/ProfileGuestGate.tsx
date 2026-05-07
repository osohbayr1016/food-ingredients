"use client";

import Link from "next/link";

export function ProfileGuestGate() {
  return (
    <main className="flex flex-col items-center space-y-6 py-14 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-(--figma-soft) text-sm font-semibold text-zinc-500">
        ?
      </div>
      <div className="max-w-xs space-y-2">
        <h1 className="text-xl font-bold text-zinc-900">Profile</h1>
        <p className="text-sm text-zinc-600">
          You need to sign in with a profile to save recipes and see them here alongside recipes you liked.
        </p>
      </div>
      <Link
        href="/login"
        className="w-full max-w-[280px] rounded-full bg-(--figma-primary) py-3.5 text-sm font-semibold text-white touch-manipulation"
      >
        Continue to save recipes
      </Link>
    </main>
  );
}
