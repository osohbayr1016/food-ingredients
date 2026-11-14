import { Hono } from "hono";
import type { Env } from "../../bindings";
import { parseTagName } from "../../lib/editorialInputs";
import { d1ErrorMessage } from "../../lib/d1Errors";

export const tagsAdmin = new Hono<{ Bindings: Env }>();

tagsAdmin.get("/tags", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM tags ORDER BY name COLLATE NOCASE ASC`,
  ).all();
  return c.json({ tags: results ?? [] });
});

tagsAdmin.post("/tags", async (c) => {
  const body = await c.req.json().catch(() => null) as { name?: unknown } | null;
  const name = parseTagName(body?.name);
  if (!name) return c.json({ error: "invalid_tag_name" }, 400);
  try {
    const existing = await c.env.DB.prepare("SELECT id FROM tags WHERE name=? COLLATE NOCASE")
      .bind(name).first();
    if (existing) return c.json({ error: "tag_already_exists" }, 409);
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`INSERT INTO tags (id, name) VALUES (?,?)`).bind(id, name).run();
    return c.json({ id });
  } catch (error) {
    if (/UNIQUE constraint failed: tags\./i.test(d1ErrorMessage(error)))
      return c.json({ error: "tag_already_exists" }, 409);
    console.error("admin/tags POST", error);
    return c.json({ error: "tag_create_failed" }, 503);
  }
});

tagsAdmin.delete("/tags/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare(`DELETE FROM tags WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});
