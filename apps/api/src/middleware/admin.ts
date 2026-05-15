import { createMiddleware } from "hono/factory";
import type { Env } from "../bindings";
import { verifyJwt } from "../lib/jwtHs256";

export const adminMw = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const hdr = c.req.header("Authorization");
  const token = hdr?.startsWith("Bearer ") ? hdr.slice(7).trim() : null;
  if (!token) return c.json({ error: "unauthorized" }, 401);
  if (token === c.env.ADMIN_SECRET) {
    await next();
    return;
  }
  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (payload?.role === "admin") {
    await next();
    return;
  }
  return c.json({ error: "unauthorized" }, 401);
});
