import { getOptionalRequestContext } from "@cloudflare/next-on-pages";
import { PRODUCTION_API_ORIGIN, apiBase } from "./publicEnv";

function absoluteApiOrigin(raw: string): string {
  const t = raw.trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(t)) return t;
  return PRODUCTION_API_ORIGIN.replace(/\/$/, "");
}

function pathToInternalRequest(path: string, init?: RequestInit): Request {
  const p = path.startsWith("/") ? path : `/${path}`;
  const u = new URL(p, "https://internal/");
  return new Request(u.toString(), { cache: "no-store", ...init });
}

/** Server Components only — uses service binding when available (recommended on Workers). */
export async function serverGetJson<T>(path: string, init?: RequestInit) {
  const ctx = getOptionalRequestContext();
  const api = ctx?.env?.API_SERVICE;

  if (typeof api?.fetch === "function") {
    const res = await api.fetch(pathToInternalRequest(path, init));
    const p = path.startsWith("/") ? path : `/${path}`;
    if (!res.ok) throw new Error(`api ${p} ${res.status}`);
    return (await res.json()) as T;
  }

  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${absoluteApiOrigin(apiBase())}${p}`;
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`api ${p} ${res.status}`);
  return (await res.json()) as T;
}
