import test from "node:test";
import assert from "node:assert/strict";
import { READY_TO_PUBLISH_SQL, publishOneApprovedRecipe } from "../src/lib/dailyApprovedPublish.ts";

function fixture({ enabled = "true", candidate = {id:"recipe-1"}, status = "published" } = {}) {
  const queries = []; let batches = 0;
  const db = {
    prepare(sql) {
      queries.push(sql);
      return {
        bind(...args) {
          return {first: async () => sql.includes("SELECT r.id")
            ? candidate : sql.includes("SELECT status") ? {status} : null,
            run:async () => ({success:true})};
        },
        first: async () => candidate,
      };
    },
    batch: async (statements) => {batches++; assert.equal(statements.length,2);return [];},
  };
  return { env:{AUTO_DAILY_PUBLISH:enabled,DB:db},queries,getBatches:()=>batches };
}

test("publishing is explicitly opt-in", async () => {
  const x=fixture({enabled:"false"});
  assert.equal(await publishOneApprovedRecipe(x.env),"disabled");
  assert.equal(x.queries.length,0);
});
test("empty approved queue cannot publish a random imported draft", async () => {
  const x=fixture({candidate:null});
  assert.equal(await publishOneApprovedRecipe(x.env),"no_approved_queued_recipe");
  assert.equal(x.getBatches(),0);
});
test("daily release uses editorial and rights guards in a batch", async () => {
  const x=fixture();
  assert.equal(await publishOneApprovedRecipe(x.env),"published:recipe-1");
  assert.equal(x.getBatches(),1);
  assert.match(READY_TO_PUBLISH_SQL,/review_status='approved'/);
  assert.match(READY_TO_PUBLISH_SQL,/license_name/);
  assert.match(READY_TO_PUBLISH_SQL,/COUNT\(\*\) FROM steps/);
  assert.ok(x.queries.some(sql => sql.includes("q.status='queued'")));
});
test("revoked approvals never claim a successful publication", async () => {
  const x=fixture({status:"queued"});
  assert.equal(await publishOneApprovedRecipe(x.env),"skipped_stale_review");
});
