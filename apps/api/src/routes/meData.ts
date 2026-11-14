import { Hono } from "hono";
import type { Env } from "../bindings";
import { bearerPayload } from "../lib/authBearer";
import { verifyPassword } from "../lib/password";
import { checkAuthRateLimit } from "../lib/authRateLimit";
import { mealPlanExportRows, type StoredMealPlanExportRow } from "../lib/mealPlanExport";

export const meData=new Hono<{Bindings:Env}>();

meData.get("/me/export",async c=>{
  const jwt=await bearerPayload(c);
  if(!jwt) return c.json({error:"unauthorized"},401);
  try{
    const [account,nutrition,saved,liked,history,pantry,reviewEvents,publicationEntries,mealPlans]=await Promise.all([
      c.env.DB.prepare("SELECT id,username,role,created_at FROM users WHERE id=?").bind(jwt.sub).first(),
      c.env.DB.prepare("SELECT sex,age_years,height_cm,weight_kg,activity_level,goal,updated_at FROM user_nutrition_profiles WHERE user_id=?").bind(jwt.sub).first(),
      c.env.DB.prepare("SELECT recipe_id,saved_at FROM saved_recipes WHERE user_id=? ORDER BY saved_at DESC").bind(jwt.sub).all(),
      c.env.DB.prepare("SELECT recipe_id,liked_at FROM recipe_likes WHERE user_id=? ORDER BY liked_at DESC").bind(jwt.sub).all(),
      c.env.DB.prepare("SELECT recipe_id,cooked_at,rating,personal_note FROM cook_history WHERE user_id=? ORDER BY cooked_at DESC").bind(jwt.sub).all(),
      c.env.DB.prepare("SELECT items_json,revision,updated_at FROM user_pantry_snapshots WHERE user_id=?").bind(jwt.sub)
        .first<{items_json:string;revision:number;updated_at:string}>(),
      c.env.DB.prepare("SELECT id,recipe_id,action,created_at FROM recipe_review_events WHERE actor_id=?").bind(jwt.sub).all(),
      c.env.DB.prepare("SELECT recipe_id,status,queued_at,published_at FROM recipe_publication_queue WHERE queued_by=?").bind(jwt.sub).all(),
      c.env.DB.prepare("SELECT week_start,plan_json,portions_json,checked_json,titles_json,revision,updated_at FROM user_meal_plan_snapshots WHERE user_id=? ORDER BY week_start DESC").bind(jwt.sub).all<StoredMealPlanExportRow>(),
    ]);
    if(!account) return c.json({error:"unauthorized"},401);
    c.header("Cache-Control","no-store");
    c.header("Content-Disposition",'attachment; filename="food-ingredients-data.json"');
    return c.json({
      format_version:1,exported_at:new Date().toISOString(),
      account,
      nutrition_profile:nutrition??null,
      saved_recipes:saved.results??[],
      liked_recipes:liked.results??[],
      cooking_history:history.results??[],
      review_events:reviewEvents.results??[],
      editorial_queue_entries:publicationEntries.results??[],
      meal_plans:mealPlanExportRows(mealPlans.results??[]),
      pantry:pantry?{
        items:JSON.parse(pantry.items_json) as unknown,
        revision:pantry.revision,
        updated_at:pantry.updated_at,
      }:null,
    });
  }catch(error){
    console.error("me/export",error);
    return c.json({error:"data_export_unavailable"},503);
  }
});

/** Delete optional, sensitive nutrition profile without deleting the account. */
meData.delete("/me/nutrition",async c=>{
  const jwt=await bearerPayload(c);
  if(!jwt) return c.json({error:"unauthorized"},401);
  try{
    await c.env.DB.prepare("DELETE FROM user_nutrition_profiles WHERE user_id=?").bind(jwt.sub).run();
    c.header("Cache-Control","no-store");
    return c.json({ok:true});
  }catch(error){
    console.error("me/nutrition DELETE",error);
    return c.json({error:"nutrition_delete_unavailable"},503);
  }
});

/** Delete the account only after password + exact username verification. */
meData.delete("/me/account",async c=>{
  const jwt=await bearerPayload(c);
  if(!jwt) return c.json({error:"unauthorized"},401);
  const body=await c.req.json().catch(()=>null) as {password?:unknown;confirm_username?:unknown}|null;
  if(typeof body?.password!=="string" || typeof body.confirm_username!=="string" ||
     body.password.length<1 || body.password.length>256 || body.confirm_username.length>32)
    return c.json({error:"confirmation_required"},400);
  try{
    const account=await c.env.DB.prepare(
      "SELECT id,username,role,password_hash FROM users WHERE id=?"
    ).bind(jwt.sub).first<{id:string;username:string;role:string;password_hash:string}>();
    if(!account) return c.json({error:"unauthorized"},401);
    if(account.role==="admin") return c.json({error:"admin_account_deletion_not_supported"},403);
    if(body.confirm_username.trim().toLowerCase()!==account.username.toLowerCase())
      return c.json({error:"username_confirmation_mismatch"},400);
    // Rate-limit by account ID, not only IP, to prevent password-guessing from
    // many networks using a stolen but still-valid bearer token.
    const limit=await checkAuthRateLimit(c.env.DB,jwt.sub,"delete_account",c.env.JWT_SECRET);
    if(!limit.allowed){
      c.header("Retry-After",String(limit.retryAfter));
      return c.json({error:"rate_limited"},429);
    }
    if(!(await verifyPassword(body.password,account.password_hash)))
      return c.json({error:"invalid_password"},401);
    // FK ON DELETE CASCADE removes saved, history, likes, nutrition, pantry and weekly meal plans.
    // Retain recipe editorial audit history without storing a deleted account ID.
    const results=await c.env.DB.batch([
      c.env.DB.prepare("UPDATE recipe_review_events SET actor_id='deleted-account' WHERE actor_id=?").bind(jwt.sub),
      c.env.DB.prepare("UPDATE recipe_publication_queue SET queued_by='deleted-account' WHERE queued_by=?").bind(jwt.sub),
      c.env.DB.prepare("DELETE FROM users WHERE id=?").bind(jwt.sub),
    ]);
    if(!results[2]?.meta.changes) return c.json({error:"account_changed"},409);
    c.header("Cache-Control","no-store");
    return c.json({ok:true});
  }catch(error){
    console.error("me/account DELETE",error);
    return c.json({error:"account_delete_unavailable"},503);
  }
});
