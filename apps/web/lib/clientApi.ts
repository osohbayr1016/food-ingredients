"use client";

import { getAuthToken } from "./authStorage";
import { apiBase } from "./publicEnv";

let sessionDeviceId: string | null = null;
export function getDeviceId() {
  if (typeof window === "undefined") return "";
  try {
    const stored = localStorage.getItem("device_id");
    if (stored) return stored;
    const id = sessionDeviceId ?? crypto.randomUUID();
    sessionDeviceId = id;
    localStorage.setItem("device_id", id);
    return id;
  } catch {
    // Private browsing/storage blocks must not disable every API request.
    sessionDeviceId ??= crypto.randomUUID();
    return sessionDeviceId;
  }
}

export async function clientFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const did = getDeviceId();
  if (did) headers.set("X-Device-Id", did);
  const auth = getAuthToken();
  if (auth) headers.set("Authorization", `Bearer ${auth}`);
  return fetch(`${apiBase()}${path}`, { ...init, headers });
}
