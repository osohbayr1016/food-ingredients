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
    allergen_evidence_url: "https://example.org/ingredient-labels",
    nutrition_evidence_url: "https://example.org/nutrition-report",
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

test("pantry matcher binds ingredient parameters before filter parameters", async () => {
  const { readFileSync } = await import("node:fs");
  const { createRequire } = await import("node:module");
  const require = createRequire(new URL("../package.json", import.meta.url));
  const ts = require("typescript");
  const content = readFileSync(new URL("../src/lib/suggestData.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(content, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    name => {
      if (name === "./suggestBodyParse") return {
        sqlPlaceholders: n => n ? "(" + Array.from({length:n},()=>"?").join(",") + ")" : "(NULL)",
      };
      throw new Error("Unexpected module: " + name);
    }, mod, mod.exports,
  );
  let preparedSql = "";
  let preparedBinds = [];
  const db = { prepare(sql) {
    preparedSql = sql;
    return { bind(...args) {
      preparedBinds = args;
      return { all: async () => ({ results: [
        {recipe_id:"r1",title:"Rice with egg",matched_rows:1,total_rows:2},
      ] }) };
    } };
  } };
  const res = await mod.exports.scoreMatchingRecipes(
    db, ["egg"], ["canonical-egg"], {max_total_minutes:30,max_difficulty:2},
  );
  assert.deepEqual(preparedBinds, ["canonical-egg", "egg", 30, 2]);
  assert.match(preparedSql, /prep_time \+ r\.cook_time\) > 0/);
  assert.equal(res.length, 1);
});

test("allergy safety and nutrition need documented evidence links", () => {
  assert.ok(validateRecipeMetadata({
    allergen_status:"ingredients_reviewed",allergens:["milk"],
  }).includes("metadata_requires_allergen_evidence"));
  assert.ok(validateRecipeMetadata({
    protein_g:25,nutrition_source:"Measured",nutrition_evidence_url:null,
  }).includes("metadata_requires_nutrition_evidence"));
  assert.equal(metadataFromRow({
    review_status:"approved",allergen_status:"ingredients_reviewed",allergens_json:"[]",
    allergen_evidence_url:null,
  }).allergen_status,"unknown");
  assert.equal(metadataFromRow({
    review_status:"approved",allergen_status:"ingredients_reviewed",allergens_json:'["milk"]',
    allergen_evidence_url:"https://example.org/check",
  }).allergen_status,"ingredients_reviewed");
});
