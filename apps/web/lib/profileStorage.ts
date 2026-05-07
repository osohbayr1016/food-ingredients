const PROFILE_KEY = "food_profile";
const LIKED_KEY = "food_liked_recipe_ids";

export type FoodProfile = { name: string; handle: string };

export function readProfile(): FoodProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as FoodProfile;
    const name = p?.name?.trim();
    if (!name) return null;
    let handle = p.handle?.trim() || `@${slugify(name)}`;
    if (!handle.startsWith("@")) handle = `@${slugify(handle)}`;
    return { name, handle };
  } catch {
    return null;
  }
}

export function writeProfile(name: string, handleInput: string) {
  const n = name.trim();
  if (!n || typeof window === "undefined") return;
  let h = handleInput.trim();
  if (!h) {
    h = `@${slugify(n)}`;
  } else if (h.startsWith("@")) {
    const inner = slugify(h.slice(1));
    h = `@${inner || slugify(n)}`;
  } else {
    h = `@${slugify(h)}`;
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: n, handle: h }));
  dispatchLibrary();
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(LIKED_KEY);
  dispatchLibrary();
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 32) || "cook"
  );
}

export function readLikedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function toggleLikedId(recipeId: string): boolean {
  if (typeof window === "undefined") return false;
  const ids = readLikedIds();
  const has = ids.includes(recipeId);
  const next = has ? ids.filter((id) => id !== recipeId) : [...ids, recipeId];
  localStorage.setItem(LIKED_KEY, JSON.stringify(next));
  dispatchLibrary();
  return !has;
}

export function isLikedId(recipeId: string) {
  return readLikedIds().includes(recipeId);
}

export function dispatchLibrary() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("food-library-changed"));
}
