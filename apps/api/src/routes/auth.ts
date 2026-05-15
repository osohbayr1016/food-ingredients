import { Hono } from "hono";
import type { Env } from "../bindings";
import { bearerPayload } from "../lib/authBearer";
import {
  isD1NoSuchTableUsers,
  isD1UniqueConstraintOnUsers,
} from "../lib/d1Errors";
import { signJwt } from "../lib/jwtHs256";
import { hashPassword, verifyPassword } from "../lib/password";

const USER_RE = /^[a-zA-Z0-9_]{3,32}$/;
const TTL_SEC = 60 * 60 * 24 * 14;

function jwtSecretOk(s: string | undefined): s is string {
  return typeof s === "string" && s.trim().length >= 16;
}

export const auth = new Hono<{ Bindings: Env }>();

auth.post("/auth/register", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  const username = body?.username?.trim() ?? "";
  const password = body?.password ?? "";
  if (!jwtSecretOk(c.env.JWT_SECRET)) {
    return c.json({ error: "server_misconfigured" }, 503);
  }
  if (!USER_RE.test(username)) {
    return c.json({ error: "invalid_username" }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: "weak_password" }, 400);
  }
  try {
    const taken = await c.env.DB.prepare(
      "SELECT id FROM users WHERE username = ? COLLATE NOCASE",
    )
      .bind(username)
      .first();
    if (taken) return c.json({ error: "username_taken" }, 409);

    const id = crypto.randomUUID();
    const password_hash = await hashPassword(password);
    await c.env.DB.prepare(
      `INSERT INTO users (id, username, password_hash, role) VALUES (?,?,?,'user')`,
    )
      .bind(id, username.toLowerCase(), password_hash)
      .run();

    const token = await signJwt(
      { sub: id, role: "user" },
      c.env.JWT_SECRET,
      TTL_SEC,
    );
    return c.json({
      token,
      user: { id, username: username.toLowerCase(), role: "user" as const },
    });
  } catch (e) {
    if (isD1UniqueConstraintOnUsers(e)) {
      return c.json({ error: "username_taken" }, 409);
    }
    if (isD1NoSuchTableUsers(e)) {
      return c.json(
        {
          error: "auth_unavailable",
          hint: "Apply D1 migration db/0003_auth_users.sql to this database.",
        },
        503,
      );
    }
    console.error("auth/register", e);
    return c.json({ error: "register_failed" }, 500);
  }
});

auth.post("/auth/login", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  const username = body?.username?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  if (!jwtSecretOk(c.env.JWT_SECRET)) {
    return c.json({ error: "server_misconfigured" }, 503);
  }
  if (!username || !password) {
    return c.json({ error: "credentials_required" }, 400);
  }
  try {
    const row = await c.env.DB.prepare(
      "SELECT id, username, password_hash, role FROM users WHERE username = ? COLLATE NOCASE",
    )
      .bind(username)
      .first<{
        id: string;
        username: string;
        password_hash: string;
        role: "user" | "admin";
      }>();
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return c.json({ error: "invalid_credentials" }, 401);
    }
    const token = await signJwt(
      { sub: row.id, role: row.role },
      c.env.JWT_SECRET,
      TTL_SEC,
    );
    return c.json({
      token,
      user: {
        id: row.id,
        username: row.username,
        role: row.role,
      },
    });
  } catch (e) {
    if (isD1NoSuchTableUsers(e)) {
      return c.json(
        {
          error: "auth_unavailable",
          hint: "Apply D1 migration db/0003_auth_users.sql to this database.",
        },
        503,
      );
    }
    console.error("auth/login", e);
    return c.json({ error: "login_failed" }, 500);
  }
});

auth.get("/auth/me", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ user: null });
  try {
    const row = await c.env.DB.prepare(
      "SELECT id, username, role FROM users WHERE id = ?",
    )
      .bind(jwt.sub)
      .first<{ id: string; username: string; role: "user" | "admin" }>();
    if (!row) return c.json({ user: null });
    return c.json({ user: row });
  } catch {
    return c.json({ user: null });
  }
});
