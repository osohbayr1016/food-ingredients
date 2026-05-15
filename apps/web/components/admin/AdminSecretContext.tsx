"use client";

import { useAuth } from "@/components/auth/AuthContext";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AdminSecretCtx = {
  adminSecret: string;
  manualSecret: string;
  setAdminSecret: (s: string) => void;
};

const AdminSecretContext = createContext<AdminSecretCtx | null>(null);

export function AdminSecretProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [manualSecret, setManualSecret] = useState(() =>
    process.env.NODE_ENV === "development" ? "admin" : "",
  );
  const t = token.trim();
  const adminSecret =
    user?.role === "admin" && t ? t : manualSecret;
  const value = useMemo(
    () => ({
      adminSecret,
      manualSecret,
      setAdminSecret: setManualSecret,
    }),
    [adminSecret, manualSecret],
  );
  return (
    <AdminSecretContext.Provider value={value}>
      {children}
    </AdminSecretContext.Provider>
  );
}

export function useAdminSecret() {
  const c = useContext(AdminSecretContext);
  if (!c) throw new Error("useAdminSecret must be used within AdminSecretProvider");
  return c;
}
