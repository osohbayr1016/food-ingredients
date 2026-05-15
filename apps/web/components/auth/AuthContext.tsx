"use client";

import { clientFetch } from "@/lib/clientApi";
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "@/lib/authStorage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthUser = {
  id: string;
  username: string;
  role: "user" | "admin";
};

type AuthCtx = {
  user: AuthUser | null;
  token: string;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTok] = useState("");
  const [ready, setReady] = useState(false);

  const refreshMe = useCallback(async () => {
    const t = getAuthToken();
    setTok(t);
    if (!t) {
      setUser(null);
      return;
    }
    const res = await clientFetch("/auth/me");
    const data = (await res.json()) as { user: AuthUser | null };
    setUser(data.user ?? null);
    if (!data.user) clearAuthToken();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refreshMe();
      } finally {
        setReady(true);
      }
    })();
  }, [refreshMe]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await clientFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? "login_failed");
    }
    const data = (await res.json()) as { token: string; user: AuthUser };
    setAuthToken(data.token);
    setTok(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await clientFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? "register_failed");
    }
    const data = (await res.json()) as { token: string; user: AuthUser };
    setAuthToken(data.token);
    setTok(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setTok("");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, token, ready, login, register, logout, refreshMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const x = useContext(Ctx);
  if (!x) throw new Error("useAuth needs AuthProvider");
  return x;
}
