import test from "node:test";
import assert from "node:assert/strict";
import { comparePantryQuantity } from "../src/lib/pantryQuantity.ts";
import {
  validateRecipeMetadata, metadataFromRow, normalizedRecipeMetadata,
} from "../src/lib/recipeMetadata.ts";

test("pantry unit equivalence", () => {
  assert.equal(comparePantryQuantity(1, "кг", 800, "г"), "enough");
  assert.equal(comparePantryQuantity(500, "г", 1, "kg"), "shortfall");
  assert.equal(comparePantryQuantity(2, "хоолны халбага", 30, "мл"), "enough");
  assert.equal(comparePantryQuantity(1, "аяга", 200, "мл"), "unknown");
  assert.equal(comparePantryQuantity(3, "ш", 4, "pieces"), "shortfall");
  assert.equal(comparePantryQuantity(1, "", 100, "г"), "unknown");
  assert.equal(comparePantryQuantity(-1, "г", 1, "г"), "unknown");
});

test("missing allergen review always defaults to unknown", () => {
  const data = metadataFromRow(null);
  assert.equal(data.allergen_status, "unknown");
  assert.deepEqual(data.allergens, []);
  assert.equal(data.calories_kcal, null);
});

test("metadata requires proper evidence and accepts reviewed ingredients", () => {
  assert.ok(validateRecipeMetadata({
    source_url: "http://insecure.example", allergens: ["unknown_allergen"],
    protein_g: 20,
  }).length >= 3);
  assert.deepEqual(validateRecipeMetadata({
    source_url: "https://example.org/recipe", license_name: "Original",
    allergens: ["milk"], allergen_status: "ingredients_reviewed",
    protein_g: 25, nutrition_source: "Measured ingredient database",
  }), []);
});

test("metadata normalization deduplicates allergens", () => {
  const value = normalizedRecipeMetadata({ allergens: ["milk", "milk", "fish", "unknown"] });
  assert.deepEqual(value.allergens, ["milk", "fish"]);
  assert.equal(value.review_status, "pending");
});
