import { Hono } from "hono";
import type { Env } from "../bindings";
import { bearerPayload } from "../lib/authBearer";
import { parseMealPlanSnapshot, validWeekStart } from "../lib/mealPlanSync";

export const mePlan = new Hono<{ Bindings: Env }>();

type PlanRow = {
  plan_json: string; portions_json: string; checked_json: string; titles_json: string;
  revision: number; updated_at: string;
};

/** Week-scoped opt-in cloud copy. Local drafts are never automatically overwritten. */
mePlan.get("/me/meal-plan", async c => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({error:"unauthorized"},401);
  const week = c.req.query("week");
  if (!validWeekStart(week)) return c.json({error:"invalid_week"},400);
  try {
    const row = await c.env.DB.prepare(
      `SELECT plan_json,portions_json,checked_json,titles_json,revision,updated_at
       FROM user_meal_plan_snapshots WHERE user_id=? AND week_start=?`
    ).bind(jwt.sub,week).first<PlanRow>();
    return c.json({
      week_start:week,
      plan:row ? JSON.parse(row.plan_json) : {},
      portions:row ? JSON.parse(row.portions_json) : {},
      checked:row ? JSON.parse(row.checked_json) : {},
      titles:row ? JSON.parse(row.titles_json) : {},
      has_remote:!!row,
      revision:row?.revision ?? 0,
      updated_at:row?.updated_at ?? null,
    });
  } catch (error) {
    console.error("me/meal-plan GET",error);
    return c.json({error:"meal_plan_unavailable"},503);
  }
});

mePlan.put("/me/meal-plan", async c => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({error:"unauthorized"},401);
  const len = c.req.header("Content-Length");
  if (len && /^\d+$/.test(len) && Number(len)>64*1024)
    return c.json({error:"payload_too_large"},413);
  const payload = parseMealPlanSnapshot(await c.req.json().catch(()=>null));
  if (!payload) return c.json({error:"invalid_meal_plan"},400);
  const {week_start:week,expected_revision:revision,plan,portions,checked,titles} = payload;
  const values = [JSON.stringify(plan),JSON.stringify(portions),
    JSON.stringify(checked),JSON.stringify(titles)] as const;
  try {
    // D1.batch is transactional. A stale revision cannot overwrite either
    // the first cloud copy or a newer save from another device.
    const [insert,update] = await c.env.DB.batch([
      c.env.DB.prepare(`INSERT OR IGNORE INTO user_meal_plan_snapshots
        (user_id,week_start,plan_json,portions_json,checked_json,titles_json,revision)
        SELECT ?,?,?,?,?,?,1 WHERE ?=0`)
        .bind(jwt.sub,week,...values,revision),
      c.env.DB.prepare(`UPDATE user_meal_plan_snapshots SET
        plan_json=?,portions_json=?,checked_json=?,titles_json=?,
        revision=revision+1,updated_at=datetime('now')
        WHERE user_id=? AND week_start=? AND revision=?`)
        .bind(...values,jwt.sub,week,revision),
    ]);
    if (!(insert.meta.changes || update.meta.changes))
      return c.json({error:"meal_plan_conflict",message:"Reload cloud plan before saving."},409);
    const row = await c.env.DB.prepare(
      "SELECT revision,updated_at FROM user_meal_plan_snapshots WHERE user_id=? AND week_start=?"
    ).bind(jwt.sub,week).first<{revision:number;updated_at:string}>();
    return c.json({ok:true,revision:row?.revision ?? 1,updated_at:row?.updated_at ?? null});
  } catch (error) {
    console.error("me/meal-plan PUT",error);
    return c.json({error:"meal_plan_unavailable"},503);
  }
});
