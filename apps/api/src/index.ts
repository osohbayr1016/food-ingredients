import { Hono } from "hono";
import { corsMw } from "./middleware/cors";
import type { Env } from "./bindings";
import { recipes } from "./routes/recipesPublic";
import { cuisines } from "./routes/cuisines";
import { recipeTagsPublic } from "./routes/recipeTagsPublic";
import { catalog } from "./routes/catalog";
import { suggest } from "./routes/suggest";
import { auth } from "./routes/auth";
import { likes } from "./routes/likes";
import { saved } from "./routes/saved";
import { admin } from "./routes/admin";
import { meNutrition } from "./routes/meNutrition";
import { mePantry } from "./routes/mePantry";
import { importDailyCandidate } from "./lib/dailyRecipeImport";
import { publishOneApprovedRecipe } from "./lib/dailyApprovedPublish";

const app = new Hono<{ Bindings: Env }>();
app.use("*", corsMw);
app.get("/health", async (c) => {
  await c.env.DB.prepare("SELECT 1 AS ok").first();
  return c.json({ ok: true });
});

app.get("/health/ready", async (c) => {
  try {
    await c.env.DB.prepare("SELECT 1 FROM recipes LIMIT 1").all();
    await c.env.DB.prepare("SELECT 1 FROM recipe_metadata LIMIT 1").all();
    await c.env.DB.prepare("SELECT 1 FROM auth_rate_limits LIMIT 1").all();
    await c.env.DB.prepare("SELECT 1 FROM recipe_publication_queue LIMIT 1").all();
    await c.env.DB.prepare("SELECT 1 FROM recipe_review_events LIMIT 1").all();
    await c.env.DB.prepare("SELECT 1 FROM recipe_publication_dates LIMIT 1").all();
    await c.env.DB.prepare("SELECT 1 FROM user_pantry_snapshots LIMIT 1").all();
    return c.json({ ok: true, database: "ready" });
  } catch (error) {
    console.error("health/ready", error);
    return c.json({ ok: false, database: "not_ready" }, 503);
  }
});
app.route("/", recipes);
app.route("/", cuisines);
app.route("/", recipeTagsPublic);
app.route("/", catalog);
app.route("/", suggest);
app.route("/", auth);
app.route("/", likes);
app.route("/", saved);
app.route("/", meNutrition);
app.route("/", mePantry);
app.route("/", admin);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      importDailyCandidate(env).then((result) => {
        console.log("daily recipe import:", result);
      }).catch((error) => {
        console.error("daily recipe import failed", error);
        throw error;
      }),
    );
    ctx.waitUntil(
      publishOneApprovedRecipe(env).then(result => {
        console.log("daily approved publication:", result);
      }).catch(error => {
        console.error("daily approved publication failed", error);
        throw error;
      }),
    );
    ctx.waitUntil(
      env.DB.prepare("DELETE FROM auth_rate_limits WHERE window_start < ?")
        .bind(Math.floor(Date.now() / 1000) - 48 * 3600).run()
        .then(() => {}).catch((err) => console.error("auth rate-limit cleanup", err)),
    );
  },
};
