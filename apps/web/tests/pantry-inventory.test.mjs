import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePantry, parsePantryStorage, expiryStatus, usablePantry,
} from "../lib/pantryInventory.ts";

test("read existing pantry inventory safely", () => {
  const items = parsePantryStorage(JSON.stringify([
    { canonical_id: "e", name: "Eggs", quantity: "6", unit: "ш", expires_on: "2026-11-14" },
    { canonical_id: "e", name: "Eggs duplicate", quantity: "3", unit: "ш" },
    { canonical_id: "milk", name: "Milk", quantity: "-5", unit: "л", expires_on: "invalid" },
    { canonical_id: "", name: "No ID" },
  ]));
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], {
    canonical_id: "e", name: "Eggs", quantity: "6", unit: "ш", expires_on: "2026-11-14",
  });
  assert.equal(items[1].quantity, "");
  assert.equal(items[1].expires_on, "");
  assert.deepEqual(parsePantryStorage("not JSON"), []);
});

test("reject impossible dates and oversized inventory", () => {
  assert.equal(normalizePantry([{ canonical_id: "a", name: "A", expires_on: "2026-02-30" }])[0].expires_on, "");
  const items = Array.from({ length: 125 }, (_, index) => ({
    canonical_id: String(index), name: "Food " + index, quantity: "1",
  }));
  assert.equal(normalizePantry(items).length, 100);
});

test("expiry warnings exclude expired food from automatic recipe matching", () => {
  const today = "2026-11-13";
  assert.equal(expiryStatus("2026-11-12", today), "expired");
  assert.equal(expiryStatus("2026-11-13", today), "soon");
  assert.equal(expiryStatus("2026-11-16", today), "soon");
  assert.equal(expiryStatus("2026-11-17", today), "fresh");
  assert.equal(expiryStatus("", today), "none");
  const values = normalizePantry([
    { canonical_id: "old", name: "Old ingredient", expires_on: "2026-11-12" },
    { canonical_id: "ok", name: "Fresh ingredient", expires_on: "2026-11-20" },
  ]);
  assert.deepEqual(usablePantry(values, today).map(x => x.canonical_id), ["ok"]);
});
