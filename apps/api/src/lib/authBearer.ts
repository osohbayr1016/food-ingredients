import type { Context } from "hono";
import type { Env } from "../bindings";
import { verifyJwt, type JwtPayload } from "./jwtHs256";

/** Reject tokens for deleted users, changed roles, and revoked sessions. */
export async function bearerPayload(c: Context<{ Bindings: Env }>): Promise<JwtPayload | null> {
  const hdr=c.req.header("Authorization");
  const token=hdr?.startsWith("Bearer ") ? hdr.slice(7).trim() : "";
  if(!token) return null;
  const payload=await verifyJwt(token,c.env.JWT_SECRET);
  if(!payload) return null;
  try{
    const user=await c.env.DB.prepare(
      `SELECT u.role,COALESCE(s.version,0) AS version FROM users u
      LEFT JOIN user_session_versions s ON s.user_id=u.id WHERE u.id=?`
    ).bind(payload.sub).first<{role:"user"|"admin";version:number}>();
    if(!user || user.role!==payload.role || user.version!==(payload.ver??0)) return null;
    return payload;
  }catch(error){
    console.error("auth session DB unavailable",error);
    return null;
  }
}
