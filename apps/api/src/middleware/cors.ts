import { createMiddleware } from "hono/factory";
import type { Env } from "../bindings";
import { allowedCorsOrigin } from "../lib/corsPolicy";

export const corsMw=createMiddleware<{Bindings:Env}>(async(c,next)=>{
  const origin=c.req.header("Origin");
  const allowed=allowedCorsOrigin(origin,c.env.PUBLIC_ORIGINS);
  c.header("Vary","Origin");
  c.header("X-Content-Type-Options","nosniff");
  c.header("Referrer-Policy","no-referrer");
  c.header("Access-Control-Allow-Methods","GET,POST,PATCH,PUT,DELETE,OPTIONS");
  c.header("Access-Control-Allow-Headers","Content-Type,Authorization,X-Device-Id,X-Recipe-Id");
  if(allowed)c.header("Access-Control-Allow-Origin",allowed);
  if(c.req.method==="OPTIONS"){
    if(origin&&!allowed)return c.json({error:"origin_not_allowed"},403);
    return c.body(null,204);
  }
  const path=c.req.path;
  if(/^\/(auth|me|saved|likes|history|admin)(\/|$)/.test(path))
    c.header("Cache-Control","no-store");
  await next();
});
