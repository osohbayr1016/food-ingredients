import type { Context } from "hono";
import type { Env } from "../bindings";
import { verifyJwt, type JwtPayload } from "../lib/jwtHs256";

export async function bearerPayload(
  c: Context<{ Bindings: Env }>,
): Promise<JwtPayload | null> {
  const hdr = c.req.header("Authorization");
  const token = hdr?.startsWith("Bearer ") ? hdr.slice(7).trim() : "";
  if (!token) return null;
  return verifyJwt(token, c.env.JWT_SECRET);
}
