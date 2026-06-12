"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AuthUser, UserType } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  /** True once the initial token check (and optional /auth/me) has finished. */
  isSessionReady: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  requireRole: (role: UserType, loginPath: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem("user");
  if (!cached) return null;
  try {
    return JSON.parse(cached) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    setIsSessionReady(false);
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const cachedUser = readCachedUser();

    if (cachedUser) {
      setUser(cachedUser);
    } else {
      setUser(null);
    }

    if (!token) {
      setIsLoading(false);
      setIsSessionReady(true);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
    } catch {
      setUser(null);
      api.clearSession();
    } finally {
      setIsLoading(false);
      setIsSessionReady(true);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const logout = useCallback(async () => {
    const role = user?.user_type;
    await api.logout();
    setUser(null);
    setIsSessionReady(true);
    if (role === "provider") {
      router.push("/login/provider");
      return;
    }
    if (role === "admin") {
      router.push("/login/admin");
      return;
    }
    router.push("/login/seeker");
  }, [router, user?.user_type]);

  const requireRole = useCallback(
    (role: UserType, loginPath: string) => {
      if (!isSessionReady) return false;
      if (!user) {
        router.push(loginPath);
        return false;
      }
      if (user.user_type !== role) {
        router.push(loginPath);
        return false;
      }
      return true;
    },
    [isSessionReady, user, router],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isSessionReady,
      isAuthenticated: !!user,
      logout,
      refresh: loadUser,
      requireRole,
    }),
    [user, isLoading, isSessionReady, logout, loadUser, requireRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
