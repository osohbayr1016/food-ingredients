"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { readProfile, writeProfile } from "@/lib/profileStorage";

export function LoginForm({
  initialNext,
  reason,
}: {
  initialNext?: string;
  reason?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  useEffect(() => {
    const p = readProfile();
    if (p) {
      setName(p.name);
      setHandle(p.handle.startsWith("@") ? p.handle : `@${p.handle}`);
    }
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    writeProfile(name, handle);
    const next =
      typeof initialNext === "string" && initialNext.startsWith("/")
        ? initialNext
        : "/profile";
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-md flex-col gap-4 py-6">
      {reason === "save" ? (
        <p className="text-center text-sm text-zinc-600">
          Create a profile to <span className="font-semibold text-zinc-900">save recipes</span> to{" "}
          your library.
        </p>
      ) : (
        <p className="text-center text-sm text-zinc-600">
          Browsing stays free — a profile unlocks saves and your tab on Profile.
        </p>
      )}
      <label className="space-y-1 text-sm">
        <span className="text-zinc-500">Display name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-(--figma-primary)"
          placeholder="Alex Cook"
          autoComplete="name"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-zinc-500">Handle (optional)</span>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-(--figma-primary)"
          placeholder="@alex_cook"
        />
      </label>
      <button
        type="submit"
        className="rounded-2xl bg-(--figma-primary) py-3 text-sm font-semibold text-white touch-manipulation"
      >
        Continue
      </button>
      <Link href="/" className="py-2 text-center text-sm text-(--figma-primary) touch-manipulation">
        Back to browsing
      </Link>
    </form>
  );
}
