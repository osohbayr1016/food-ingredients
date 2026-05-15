const KEY = "auth_token";

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY)?.trim() ?? "";
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(KEY, token);
  else localStorage.removeItem(KEY);
}

export function clearAuthToken() {
  setAuthToken("");
}
