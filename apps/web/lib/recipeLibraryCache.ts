"use client";

import { clientFetch } from "@/lib/clientApi";

type Kind = "saved" | "likes";
type CacheEntry = { userId: string; ids: Set<string> | null; request: Promise<Set<string>> | null };
const cache: Record<Kind, CacheEntry | null> = { saved: null, likes: null };

/** Share one request across all recipe cards; never share cached data across users. */
export async function getRecipeLibraryIds(userId: string, kind: Kind): Promise<Set<string>> {
  let entry = cache[kind];
  if (!entry || entry.userId !== userId) {
    entry = { userId, ids: null, request: null };
    cache[kind] = entry;
  }
  if (entry.ids) return entry.ids;
  if (!entry.request) {
    const currentEntry = entry;
    currentEntry.request = (async () => {
      const res = await clientFetch(`/${kind}`);
      if (!res.ok) throw new Error(`library_${kind}_unavailable`);
      const data = await res.json() as { saved?: { id: string }[]; liked?: { id: string }[] };
      const rows = kind === "saved" ? data.saved : data.liked;
      return new Set((Array.isArray(rows) ? rows : []).map(r => r.id).filter(id => typeof id === "string"));
    })().then(ids => {
      if (cache[kind] === currentEntry) {
        currentEntry.ids = ids;
        currentEntry.request = null;
      }
      return ids;
    }).catch(err => {
      if (cache[kind] === currentEntry) currentEntry.request = null;
      throw err;
    });
  }
  return entry.request;
}

export function updateRecipeLibraryId(userId: string, kind: Kind, recipeId: string, selected: boolean) {
  const entry = cache[kind];
  if (!entry || entry.userId !== userId || !entry.ids) return;
  const next = new Set(entry.ids);
  if (selected) next.add(recipeId);
  else next.delete(recipeId);
  entry.ids = next;
}

/** Invalidate after other library screens refresh or server-side changes. */
export function invalidateRecipeLibraryIds(kind?: Kind) {
  if (kind) cache[kind] = null;
  else { cache.saved = null; cache.likes = null; }
}
