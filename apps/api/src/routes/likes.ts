import { Hono } from "hono";
import type { Env } from "../bindings";
import { bearerPayload } from "../lib/authBearer";

export const likes = new Hono<{ Bindings: Env }>();

likes.get("/likes", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ liked: [] });
  const { results } = await c.env.DB.prepare(
    `SELECT r.*, l.liked_at FROM recipe_likes l
     JOIN recipes r ON r.id = l.recipe_id
     WHERE l.user_id = ? AND r.is_published = 1
     ORDER BY datetime(l.liked_at) DESC`,
  )
    .bind(jwt.sub)
    .all();
  return c.json({ liked: results ?? [] });
});

likes.post("/likes", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ error: "auth_required" }, 401);
  const body = await c.req.json().catch(() => null) as { recipe_id?: string } | null;
  const recipeId = body?.recipe_id?.trim();
  if (!recipeId) return c.json({ error: "recipe_id_required" }, 400);
  const exists = await c.env.DB.prepare(
    "SELECT id FROM recipes WHERE id = ? AND is_published = 1",
  )
    .bind(recipeId)
    .first();
  if (!exists) return c.json({ error: "not_found" }, 404);
  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO recipe_likes (user_id, recipe_id) VALUES (?,?)`,
  )
    .bind(jwt.sub, recipeId)
    .run();
  return c.json({ ok: true });
});

/** Opt-in guest favorites transfer, scoped to the signed-in account. */
likes.post("/likes/import-guest", async c=>{
  const jwt=await bearerPayload(c);
  if(!jwt)return c.json({error:"auth_required"},401);
  const body=await c.req.json().catch(()=>null) as {recipe_ids?:unknown}|null;
  if(!Array.isArray(body?.recipe_ids) || body.recipe_ids.length<1 || body.recipe_ids.length>30 ||
     body.recipe_ids.some(id=>typeof id!=="string" || !id.trim() || id.length>150))
    return c.json({error:"invalid_recipe_ids"},400);
  const ids=[...new Set((body.recipe_ids as string[]).map(x=>x.trim()))];
  const placeholders=ids.map(()=>"?").join(",");
  try{
    const {results}=await c.env.DB.prepare(
      `SELECT id FROM recipes WHERE is_published=1 AND id IN (${placeholders})`
    ).bind(...ids).all<{id:string}>();
    const accepted=(results??[]).map(x=>x.id);
    if(accepted.length)await c.env.DB.batch(accepted.map(recipeId=>
      c.env.DB.prepare("INSERT OR IGNORE INTO recipe_likes(user_id,recipe_id) VALUES(?,?)")
        .bind(jwt.sub,recipeId)
    ));
    return c.json({ok:true,accepted_ids:accepted,skipped:ids.length-accepted.length});
  }catch(error){
    console.error("likes import guest",error);
    return c.json({error:"likes_import_unavailable"},503);
  }
});

likes.delete("/likes/:recipeId", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ error: "auth_required" }, 401);
  const recipeId = c.req.param("recipeId");
  await c.env.DB.prepare(
    "DELETE FROM recipe_likes WHERE user_id = ? AND recipe_id = ?",
  )
    .bind(jwt.sub, recipeId)
    .run();
  return c.json({ ok: true });
});

likes.get("/likes/:recipeId", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ liked: false });
  const recipeId = c.req.param("recipeId");
  const row = await c.env.DB.prepare(
    "SELECT 1 AS ok FROM recipe_likes WHERE user_id = ? AND recipe_id = ?",
  )
    .bind(jwt.sub, recipeId)
    .first();
  return c.json({ liked: !!row });
});
