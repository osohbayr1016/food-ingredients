import { createMiddleware } from "hono/factory";
import type { Env } from "../bindings";

export const adminMw = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const hdr = c.req.header("Authorization");
  const token = hdr?.startsWith("Bearer ") ? hdr.slice(7) : null;
  const ok = !!token && token === c.env.ADMIN_SECRET;
  if (!ok) return c.json({ error: "unauthorized" }, 401);
  await next();
});
