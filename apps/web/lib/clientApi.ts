"use client";

import { apiBase } from "./publicEnv";

export function getDeviceId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

export async function clientFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const did = getDeviceId();
  if (did) headers.set("X-Device-Id", did);
  return fetch(`${apiBase()}${path}`, { ...init, headers });
}
