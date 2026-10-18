"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Principal } from "./types";

const AuthContext = createContext<Principal | null>(null);
export function AuthProvider({
  user,
  children,
}: {
  user: Principal | null;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!user) return;
    async function checkSession() {
      const response = await fetch("/api/platform/auth/me").catch(() => null);
      if (response?.status === 401) window.location.replace("/login");
      else if (response?.ok) {
        const payload = await response.json();
        if (payload.data?.id !== user?.id) window.location.reload();
      }
    }
    const onFocus = () => {
      void checkSession();
    };
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(onFocus, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [user]);
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}
export function useCurrentUser() {
  return useContext(AuthContext);
}
