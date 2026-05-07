import { createMiddleware } from "hono/factory";
import type { Env } from "../bindings";

function parseOrigins(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const corsMw = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const origins = parseOrigins(c.env.PUBLIC_ORIGINS || "");
  const origin = c.req.header("Origin");
  const header =
    origin && origins.includes(origin)
      ? origin
      : origins[0] || "*";

  c.header("Access-Control-Allow-Origin", header);
  c.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  c.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Device-Id, X-Recipe-Id",
  );
  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }
  await next();
});
