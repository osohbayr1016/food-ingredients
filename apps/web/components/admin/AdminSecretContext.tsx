"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AdminSecretCtx = {
  adminSecret: string;
  setAdminSecret: (s: string) => void;
};

const AdminSecretContext = createContext<AdminSecretCtx | null>(null);

export function AdminSecretProvider({ children }: { children: ReactNode }) {
  const [adminSecret, setAdminSecret] = useState("");
  const value = useMemo(
    () => ({ adminSecret, setAdminSecret }),
    [adminSecret],
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
