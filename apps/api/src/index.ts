import { Hono } from "hono";
import { corsMw } from "./middleware/cors";
import type { Env } from "./bindings";
import { recipes } from "./routes/recipesPublic";
import { cuisines } from "./routes/cuisines";
import { catalog } from "./routes/catalog";
import { suggest } from "./routes/suggest";
import { saved } from "./routes/saved";
import { admin } from "./routes/admin";

const app = new Hono<{ Bindings: Env }>();

app.use("*", corsMw);

app.get("/health", async (c) => {
  await c.env.DB.prepare("SELECT 1 AS ok").first();
  return c.json({ ok: true });
});

app.route("/", recipes);
app.route("/", cuisines);
app.route("/", catalog);
app.route("/", suggest);
app.route("/", saved);
app.route("/", admin);

export default app;
