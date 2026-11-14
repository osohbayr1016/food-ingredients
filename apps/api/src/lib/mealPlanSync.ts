/** A weekly plan is explicitly synced per account. No guessing/merging concurrent edits. */
export type MealPlanSnapshot = {
  week_start: string;
  expected_revision: number;
  plan: Record<string, string>;
  portions: Record<string, number>;
  checked: Record<string, boolean>;
  titles: Record<string, string>;
};
const SLOT = /^[0-6]\|(breakfast|lunch|dinner)$/;
const RECIPE_ID = /^[A-Za-z0-9_-]{1,150}$/;

export function validWeekStart(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year,month,day] = value.split("-").map(Number);
  if (year < 2000 || year > 2100) return false;
  const date = new Date(Date.UTC(year,month - 1,day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day && date.getUTCDay() === 1;
}

function recordOf<T>(
  value: unknown, maxEntries: number,
  allow: (key: string, value: unknown) => value is T,
): Record<string,T> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const pairs = Object.entries(value);
  if (pairs.length > maxEntries || pairs.some(([k,v]) => !allow(k,v))) return null;
  return Object.fromEntries(pairs) as Record<string,T>;
}

export function parseMealPlanSnapshot(raw: unknown): MealPlanSnapshot | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const x = raw as Record<string,unknown>;
  if (!validWeekStart(x.week_start) ||
      typeof x.expected_revision !== "number" ||
      !Number.isSafeInteger(x.expected_revision) ||
      x.expected_revision < 0 || x.expected_revision >= 1_000_000_000) return null;
  const plan = recordOf(x.plan,21,(key,val):val is string=>
    SLOT.test(key) && typeof val === "string" && (val === "" || RECIPE_ID.test(val)));
  const portions = recordOf(x.portions,21,(key,val):val is number=>
    SLOT.test(key) && typeof val === "number" &&
    Number.isSafeInteger(val) && val >= 1 && val <= 30);
  const checked = recordOf(x.checked,250,(key,val):val is boolean=>
    key.length >= 1 && key.length <= 250 && !/[\u0000-\u001F\u007F]/.test(key) &&
    typeof val === "boolean");
  const titles = recordOf(x.titles,100,(key,val):val is string=>
    RECIPE_ID.test(key) && typeof val === "string" &&
    val.trim().length > 0 && val.length <= 160);
  if (!plan || !portions || !checked || !titles) return null;
  return {week_start:x.week_start,expected_revision:x.expected_revision,
    plan,portions,checked,titles};
}
