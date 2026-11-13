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
import { importDailyCandidate } from "./lib/dailyRecipeImport";

const app = new Hono<{ Bindings: Env }>();
app.use("*", corsMw);
app.get("/health", async (c) => {
  await c.env.DB.prepare("SELECT 1 AS ok").first();
  return c.json({ ok: true });
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
      env.DB.prepare("DELETE FROM auth_rate_limits WHERE window_start < ?")
        .bind(Math.floor(Date.now() / 1000) - 48 * 3600).run()
        .then(() => {}).catch((err) => console.error("auth rate-limit cleanup", err)),
    );
  },
};
