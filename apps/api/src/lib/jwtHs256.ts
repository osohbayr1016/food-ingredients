const te = new TextEncoder();
const td = new TextDecoder();

function b64url(buf: Uint8Array): string {
  let s = "";
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]!);
  const b64 = btoa(s);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw",
    te.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, te.encode(data));
  return b64url(new Uint8Array(sig));
}

export type JwtPayload = { sub: string; role: "user" | "admin" };

export async function signJwt(
  payload: JwtPayload,
  secret: string,
  ttlSec: number,
): Promise<string> {
  const header = b64url(te.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(
    te.encode(
      JSON.stringify({
        sub: payload.sub,
        role: payload.role,
        iat: now,
        exp: now + ttlSec,
      }),
    ),
  );
  const sig = await hmac(secret, `${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

export async function verifyJwt(
  token: string,
  secret: string,
): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const sig = await hmac(secret, `${h}.${p}`);
  if (sig.length !== s.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ s.charCodeAt(i);
  if (diff !== 0) return null;
  let json: { sub?: string; role?: string; exp?: number };
  try {
    json = JSON.parse(td.decode(b64urlToBytes(p))) as {
      sub?: string;
      role?: string;
      exp?: number;
    };
  } catch {
    return null;
  }
  if (
    typeof json.sub !== "string" ||
    (json.role !== "user" && json.role !== "admin") ||
    typeof json.exp !== "number"
  ) {
    return null;
  }
  if (json.exp < Math.floor(Date.now() / 1000)) return null;
  return { sub: json.sub, role: json.role };
}
