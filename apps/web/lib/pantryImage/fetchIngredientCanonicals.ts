import { clientFetch } from "@/lib/clientApi";
import {
  sanitizeCanonRows,
  type CanonRow,
} from "@/lib/pantryImage/sanitizeCanonRows";

export type { CanonRow };

/** Full catalog for published ingredients, fallback to all canonicals (see API). */
export async function fetchIngredientCanonicals(): Promise<CanonRow[]> {
  const res = await clientFetch("/ingredient-catalog");
  if (!res.ok) throw new Error("Could not load ingredient catalog");
  const data = (await res.json()) as { canonicals?: unknown };
  return sanitizeCanonRows(data.canonicals);
}
