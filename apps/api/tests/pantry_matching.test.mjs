import test from "node:test";
import assert from "node:assert/strict";
import { comparePantryQuantity, enrichPreviewWithPantryQty } from "../src/lib/pantryQuantity.ts";

const ingredient = (id, quantity, unit = "г") => ({
  recipe_id: "recipe-1", ingredient_canonical_id: id, name: id,
  quantity, unit, note: null, category_name: "Other", sort_order: 0,
});
const preview = ings => ings.map(i => ({
  name: i.name, quantity: i.quantity, unit: i.unit, category_name: i.category_name,
  note: null, matched: true,
}));
const line = (id, quantity, unit = "г") => ({ canonical_id: id, name: id, quantity, unit });

test("blank units never certify pantry availability", () => {
  assert.equal(comparePantryQuantity(1, "", 1, ""), "unknown");
  assert.equal(comparePantryQuantity(1, "кг", 900, "г"), "enough");
});
test("missing quantity is flagged as unknown, not sufficient", () => {
  const ings = [ingredient("rice", 200)];
  const result = enrichPreviewWithPantryQty(ings, preview(ings), [line("rice", undefined)]);
  assert.equal(result.preview[0].quantity_status, "unknown");
  assert.equal(result.preview[0].quantity_issue, true);
});
test("one stock quantity cannot satisfy multiple uses in the same recipe", () => {
  const ings = [ingredient("rice", 150), ingredient("rice", 100)];
  const result = enrichPreviewWithPantryQty(ings, preview(ings), [line("rice", 200)]);
  assert.deepEqual(result.preview.map(x => x.quantity_status), ["enough", "shortfall"]);
  assert.equal(result.pantry_shortfall, true);
});
test("several pantry batches can satisfy one requirement once", () => {
  const ings = [ingredient("rice", 900)];
  const stock = [line("rice", 0.5, "кг"), line("rice", 400)];
  const result = enrichPreviewWithPantryQty(ings, preview(ings), stock);
  assert.equal(result.preview[0].quantity_status, "enough");
});
test("unknown unit remains unknown and absent ingredient remains missing", () => {
  const ings = [ingredient("milk", 100, "мл"), ingredient("flour", 50)];
  const lines = [line("milk", 100, "г")];
  const p = preview(ings); p[1].matched = false;
  const result = enrichPreviewWithPantryQty(ings, p, lines);
  assert.deepEqual(result.preview.map(x => x.quantity_status), ["unknown", "missing"]);
});
