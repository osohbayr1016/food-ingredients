import { Hono } from "hono";
import type { Env } from "../bindings";
import { bearerPayload } from "../lib/authBearer";
import { parseAccountPantry, validPantryRevision, type AccountPantryItem } from "../lib/pantrySync";

export const mePantry=new Hono<{Bindings:Env}>();

mePantry.get("/me/pantry",async c=>{
  const jwt=await bearerPayload(c);
  if(!jwt) return c.json({error:"unauthorized"},401);
  try {
    const row=await c.env.DB.prepare(
      "SELECT items_json,revision,updated_at FROM user_pantry_snapshots WHERE user_id=?"
    ).bind(jwt.sub).first<{items_json:string;revision:number;updated_at:string}>();
    return c.json({
      items: row ? (JSON.parse(row.items_json) as AccountPantryItem[]) : [],
      revision:row?.revision??0,
      has_remote:!!row,
      updated_at:row?.updated_at??null,
    });
  }catch(error){
    console.error("me/pantry GET",error);
    return c.json({error:"pantry_unavailable"},503);
  }
});

mePantry.put("/me/pantry",async c=>{
  const jwt=await bearerPayload(c);
  if(!jwt) return c.json({error:"unauthorized"},401);
  const body=await c.req.json().catch(()=>null) as {items?:unknown;expected_revision?:unknown}|null;
  if(!body || !validPantryRevision(body.expected_revision)) return c.json({error:"invalid_revision"},400);
  const items=parseAccountPantry(body.items);
  if(!items) return c.json({error:"invalid_pantry_items"},400);
  try{
    // A batch is transactional. Only revision zero may create a new cloud pantry;
    // existing snapshots are updated using compare-and-swap revision checks.
    const [insert,update]=await c.env.DB.batch([
      c.env.DB.prepare(`INSERT OR IGNORE INTO user_pantry_snapshots(user_id,items_json,revision)
        SELECT ?,?,1 WHERE ?=0`).bind(jwt.sub,JSON.stringify(items),body.expected_revision),
      c.env.DB.prepare(`UPDATE user_pantry_snapshots
        SET items_json=?,revision=revision+1,updated_at=datetime('now')
        WHERE user_id=? AND revision=?`).bind(JSON.stringify(items),jwt.sub,body.expected_revision),
    ]);
    if (!(insert.meta.changes || update.meta.changes)) {
      return c.json({error:"pantry_conflict",message:"Reload cloud pantry before saving."},409);
    }
    const row=await c.env.DB.prepare(
      "SELECT revision,updated_at FROM user_pantry_snapshots WHERE user_id=?"
    ).bind(jwt.sub).first<{revision:number;updated_at:string}>();
    return c.json({ok:true,revision:row?.revision??1,updated_at:row?.updated_at??null});
  }catch(error){
    console.error("me/pantry PUT",error);
    return c.json({error:"pantry_unavailable"},503);
  }
});
