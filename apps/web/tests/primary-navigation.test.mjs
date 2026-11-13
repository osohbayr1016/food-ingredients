import test from "node:test";
import assert from "node:assert/strict";
import { activePrimaryDestination, PRIMARY_DESTINATIONS } from "../lib/primaryNavigation.ts";

test("three primary destinations, distinct links and Mongolian labels", () => {
  assert.deepEqual(PRIMARY_DESTINATIONS.map(x => x.href), ["/search","/pantry","/plan"]);
  assert.equal(new Set(PRIMARY_DESTINATIONS.map(x => x.id)).size,3);
  assert.ok(PRIMARY_DESTINATIONS.every(x => x.label.length >= 5));
});
test("browse/search/recipe stay in the recipe destination", () => {
  for(const path of ["/","/search","/discover","/cuisines","/recipe/example"]) {
    assert.equal(activePrimaryDestination(path),"recipes",path);
  }
});
test("saved pantry picks and meal planner have stable active destinations", () => {
  for(const path of ["/pantry","/suggest"]) assert.equal(activePrimaryDestination(path),"pantry");
  assert.equal(activePrimaryDestination("/plan"),"plan");
  for(const path of ["/profile","/saved","/login"]) assert.equal(activePrimaryDestination(path),null);
});
