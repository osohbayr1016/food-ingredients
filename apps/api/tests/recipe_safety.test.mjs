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

test("publication requires editorial approval, content rights and complete ingredients", async () => {
  const { readFileSync } = await import("node:fs");
  const { createRequire } = await import("node:module");
  const require = createRequire(new URL("../package.json", import.meta.url));
  const ts = require("typescript");
  const code = readFileSync(new URL("../src/lib/recipeValidation.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (name) => {
      if (name === "./recipeMetadata") return { validateRecipeMetadata };
      throw new Error("Unexpected module: " + name);
    }, mod, mod.exports,
  );
  const validate = mod.exports.validateRecipePatch;
  const valid = {
    recipe: { title: "Chicken and rice", cuisine: "Mongolian", prep_time: 15,
      cook_time: 20, difficulty: 1, description: "Cook a safe meal using clean ingredients.",
      serves: 2, is_published: true },
    ingredients: [
      { name: "Rice", quantity: 100, unit: "g", category_id: "cat-extra" },
      { name: "Chicken", quantity: 150, unit: "g", category_id: "cat-meat" },
    ],
    steps: [{ description: "Prepare the rice." }, { description: "Cook thoroughly and serve." }],
    metadata: { review_status: "approved", license_name: "Original" },
  };
  assert.deepEqual(validate(valid), []);
  assert.ok(validate({ ...valid, metadata: { review_status: "pending", license_name: "Original" } }).includes("publish_requires_editorial_approval"));
  assert.ok(validate({ ...valid, metadata: { review_status: "approved" } }).includes("publish_requires_content_rights"));
  assert.ok(validate({ ...valid, ingredients: [] }).includes("publish_requires_ingredients"));
});
