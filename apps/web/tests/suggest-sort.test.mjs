import test from "node:test";
import assert from "node:assert/strict";
import { sortSuggestRows } from "../lib/suggestSort.ts";
test("recipes with unknown cooking time sort after known ones", () => {
  const mk = (id, prep, cook) => ({
    recipe_id:id,prep_time:prep,cook_time:cook,match_ratio:1,matched_count:1,
    difficulty:1,serves:2,
  });
  const rows=[mk("unknown",0,0),mk("quick",5,10),mk("slow",30,15)];
  assert.deepEqual(sortSuggestRows(rows,"time").map(r=>r.recipe_id),["quick","slow","unknown"]);
});
