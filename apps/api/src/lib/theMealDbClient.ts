const BASE = "https://www.themealdb.com/api/json/v1/1/";

export type MealDbSearchHit = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
};

type SearchJson = { meals: MealDbSearchHit[] | null };

type MealDetail = Record<string, string | null | undefined> & {
  idMeal: string;
  strMeal: string;
};

type LookupJson = { meals: MealDetail[] | null };

export async function searchMeals(q: string): Promise<MealDbSearchHit[]> {
  const url = `${BASE}search.php?s=${encodeURIComponent(q.trim())}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheMealDB search ${res.status}`);
  const data = (await res.json()) as SearchJson;
  return data.meals ?? [];
}

export async function lookupMealById(id: string): Promise<MealDetail | null> {
  const url = `${BASE}lookup.php?i=${encodeURIComponent(id.trim())}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheMealDB lookup ${res.status}`);
  const data = (await res.json()) as LookupJson;
  const m = data.meals?.[0];
  return m ?? null;
}
