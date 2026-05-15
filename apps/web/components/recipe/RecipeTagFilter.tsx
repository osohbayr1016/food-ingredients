"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiBase } from "@/lib/publicEnv";

export function RecipeTagFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase()}/tags`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((body: unknown) => {
        if (cancelled) return;
        const j = body as { tags?: { id: string; name: string }[] };
        setTags(Array.isArray(j.tags) ? j.tags : []);
      })
      .catch(() => {
        /* fall back — empty selects only “Any” */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <label className="space-y-1">
      <span className="text-xs text-zinc-500">Tag</span>
      <select
        disabled={pending}
        defaultValue={sp?.get("tag") ?? ""}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 touch-manipulation"
        onChange={(e) => {
          startTransition(() => {
            const q = new URLSearchParams(sp?.toString());
            if (e.target.value) q.set("tag", e.target.value);
            else q.delete("tag");
            router.push(`/?${q.toString()}`);
          });
        }}
      >
        <option value="">Any tag</option>
        {tags.map((t) => (
          <option key={t.id} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
