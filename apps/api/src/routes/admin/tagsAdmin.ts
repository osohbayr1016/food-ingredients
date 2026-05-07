import { Hono } from "hono";
import type { Env } from "../../bindings";

export const tagsAdmin = new Hono<{ Bindings: Env }>();

tagsAdmin.get("/tags", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM tags ORDER BY name COLLATE NOCASE ASC`,
  ).all();
  return c.json({ tags: results ?? [] });
});

tagsAdmin.post("/tags", async (c) => {
  const body = await c.req.json().catch(() => null) as { name?: string } | null;
  const name = body?.name?.trim();
  if (!name) return c.json({ error: "name_required" }, 400);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`INSERT INTO tags (id, name) VALUES (?,?)`)
    .bind(id, name)
    .run();
  return c.json({ id });
});

tagsAdmin.delete("/tags/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare(`DELETE FROM tags WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});
