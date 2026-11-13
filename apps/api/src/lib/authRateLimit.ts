type Action = "register" | "login";

function toHex(a: ArrayBuffer) {
  return Array.from(new Uint8Array(a)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Fixed-window limits, executed on D1; hashes client IP with the server-side secret. */
export async function checkAuthRateLimit(
  db: D1Database, ip: string, action: Action, secret: string,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const seconds = action === "register" ? 3600 : 900;
  const maxAttempts = action === "register" ? 8 : 25;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / seconds) * seconds;
  const identity = toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${secret}:auth:${ip}`)));
  await db.prepare(`INSERT INTO auth_rate_limits (key_hash, action, window_start, attempts)
    VALUES (?,?,?,1)
    ON CONFLICT(key_hash, action, window_start) DO UPDATE SET attempts=attempts+1`)
    .bind(identity, action, windowStart).run();
  const row = await db.prepare(`SELECT attempts FROM auth_rate_limits
    WHERE key_hash = ? AND action = ? AND window_start = ?`)
    .bind(identity, action, windowStart).first<{ attempts: number }>();
  return { allowed: (row?.attempts ?? maxAttempts + 1) <= maxAttempts,
    retryAfter: Math.max(1, windowStart + seconds - now) };
}
