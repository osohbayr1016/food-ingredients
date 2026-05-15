"use client";

import { useEffect, useState } from "react";
import { readProfile, writeProfile } from "@/lib/profileStorage";

export function ProfileGuestIdentityForm({
  onSaved,
}: {
  onSaved?: () => void;
}) {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  function sync() {
    const p = readProfile();
    setName(p?.name ?? "");
    setHandle(p?.handle?.replace(/^@/, "") ?? "");
  }

  useEffect(() => {
    sync();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    writeProfile(n, handle.trim());
    sync();
    onSaved?.();
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl border border-zinc-100 p-4">
      <p className="text-xs font-semibold text-zinc-600">Таны мэдээлэл (зөвхөн энэ төхөөрөмж)</p>
      <label className="block text-sm text-zinc-800">
        Нэр
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          placeholder="Жишээ: Болор"
        />
      </label>
      <label className="block text-sm text-zinc-800">
        Хэндл (сонголт)
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          placeholder="bolor_cook"
        />
      </label>
      <button
        type="submit"
        className="rounded-full bg-(--figma-primary) px-4 py-2 text-sm font-semibold text-white touch-manipulation"
      >
        Хадгалах
      </button>
    </form>
  );
}
