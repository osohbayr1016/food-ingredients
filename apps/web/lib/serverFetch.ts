import { apiBase } from "./publicEnv";

export async function serverGetJson<T>(path: string, init?: RequestInit) {
  const res = await fetch(`${apiBase()}${path}`, {
    cache: "no-store",
    ...init,
  });
  if (!res.ok) throw new Error(`api ${path} ${res.status}`);
  return (await res.json()) as T;
}
