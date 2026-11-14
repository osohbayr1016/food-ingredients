import { Hono } from "hono";
import type { Env } from "../bindings";
import { runSuggestQuery } from "../lib/suggestPost";
import { readBoundedJson } from "../lib/boundedJson";

export const suggest = new Hono<{ Bindings: Env }>();

suggest.post("/suggest", async (c) => {
  const decoded = await readBoundedJson(c.req.raw.body, 32 * 1024);
  if (!decoded.ok) return c.json({error:decoded.error},decoded.error==="payload_too_large"?413:400);
  const out = await runSuggestQuery(c.env.DB, decoded.value);
  return c.json(out);
});
