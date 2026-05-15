import { Hono } from "hono";
import type { Env } from "../bindings";
import { runSuggestQuery } from "../lib/suggestPost";

export const suggest = new Hono<{ Bindings: Env }>();

suggest.post("/suggest", async (c) => {
  const body = await c.req.json().catch(() => null);
  const out = await runSuggestQuery(c.env.DB, body);
  return c.json(out);
});
