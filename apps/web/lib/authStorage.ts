const KEY = "auth_token";

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  try { return localStorage.getItem(KEY)?.trim() ?? ""; }
  catch { return ""; }
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch { /* storage denied; authenticated requests will need a persistent session */ }
}

export function clearAuthToken() {
  setAuthToken("");
}
