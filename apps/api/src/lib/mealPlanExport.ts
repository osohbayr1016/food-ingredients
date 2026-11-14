export type StoredMealPlanExportRow = {
  week_start: string;
  plan_json: string;
  portions_json: string;
  checked_json: string;
  titles_json: string;
  revision: number;
  updated_at: string;
};

/** Transform one owner's rows into a complete, machine-readable account export. */
export function mealPlanExportRows(rows: StoredMealPlanExportRow[]) {
  return rows.map(row=>({
    week_start:row.week_start,
    revision:row.revision,
    updated_at:row.updated_at,
    plan:JSON.parse(row.plan_json) as unknown,
    portions:JSON.parse(row.portions_json) as unknown,
    checked:JSON.parse(row.checked_json) as unknown,
    titles:JSON.parse(row.titles_json) as unknown,
  }));
}
