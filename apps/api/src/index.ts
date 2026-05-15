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

export default app;
