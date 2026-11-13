"use client";

import { clientFetch } from "@/lib/clientApi";
import { invalidateRecipeLibraryIds } from "@/lib/recipeLibraryCache";
import { dispatchLibrary } from "@/lib/profileStorage";
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
    const expectedToken=getAuthToken();
    setTok(expectedToken);
    if(!expectedToken){
      setUser(null);
      invalidateRecipeLibraryIds();
      return;
    }
    try {
      const res=await clientFetch("/auth/me",{cache:"no-store"});
      // A pending old response must never restore a signed-out or switched account.
      if(getAuthToken()!==expectedToken)return;
      if(res.status===401 || res.status===403){
        clearAuthToken();
        invalidateRecipeLibraryIds();
        setTok("");
        setUser(null);
        dispatchLibrary();
        return;
      }
      if(!res.ok)return; // Network, maintenance or database failures are not logout.
      const data=await res.json() as {user?:AuthUser|null};
      if(getAuthToken()!==expectedToken)return;
      if(!data.user){
        clearAuthToken();
        invalidateRecipeLibraryIds();
        setTok("");
        setUser(null);
        dispatchLibrary();
        return;
      }
      setUser(data.user);
    }catch{
      // Keep the session while offline, verify it again when the tab is foregrounded.
    }
  },[]);

  useEffect(() => {
    void (async () => {
      try {
        await refreshMe();
      } finally {
        setReady(true);
      }
    })();
  }, [refreshMe]);

  useEffect(()=>{
    let lastVerified=Date.now();
    const syncFromOtherTab=(event:StorageEvent)=>{
      if(event.key!=="auth_token")return;
      invalidateRecipeLibraryIds();
      setUser(null);
      setTok(event.newValue?.trim()??"");
      dispatchLibrary();
      lastVerified=Date.now();
      void refreshMe();
    };
    const recheckForeground=()=>{
      if(document.visibilityState!=="visible" || Date.now()-lastVerified<120000)return;
      lastVerified=Date.now();
      void refreshMe();
    };
    window.addEventListener("storage",syncFromOtherTab);
    document.addEventListener("visibilitychange",recheckForeground);
    return ()=>{
      window.removeEventListener("storage",syncFromOtherTab);
      document.removeEventListener("visibilitychange",recheckForeground);
    };
  },[refreshMe]);

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
    if (getAuthToken() !== data.token) throw new Error("browser_storage_unavailable");
    invalidateRecipeLibraryIds();
    setTok(data.token);
    setUser(data.user);
    dispatchLibrary();
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
    if (getAuthToken() !== data.token) throw new Error("browser_storage_unavailable");
    invalidateRecipeLibraryIds();
    setTok(data.token);
    setUser(data.user);
    dispatchLibrary();
  }, []);

  const logout = useCallback(() => {
    invalidateRecipeLibraryIds();
    clearAuthToken();
    setTok("");
    setUser(null);
    dispatchLibrary();
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
