import { SuggestResultCard } from "@/components/suggest/SuggestResultCard";
import type { SuggestResultRow } from "@/components/suggest/suggestTypes";

export type { IngredientPreviewLine, SuggestResultRow } from "@/components/suggest/suggestTypes";

export function SuggestResults({ rows }: { rows: SuggestResultRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-zinc-900">Хамгийн ойрын тааруулалт</h2>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.recipe_id}>
            <SuggestResultCard row={normalizeRow(row)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function normalizeRow(row: SuggestResultRow): SuggestResultRow {
  return {
    ...row,
    ingredients_preview: row.ingredients_preview ?? [],
  };
}
