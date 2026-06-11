"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AuthUser, UserType } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
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
  const router = useRouter();

  const loadUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const cachedUser = readCachedUser();

    if (cachedUser) {
      setUser(cachedUser);
    } else {
      setUser(null);
    }

    if (!token) {
      setIsLoading(false);
      return;
    }

    // Trust the session written at login while /auth/me refreshes in the background.
    if (cachedUser) {
      setIsLoading(false);
    }

    try {
      const me = await api.getMe();
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
    } catch {
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const logout = useCallback(async () => {
    const role = user?.user_type;
    await api.logout();
    setUser(null);
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
      if (isLoading) return false;
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
    [isLoading, user, router],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      logout,
      refresh: loadUser,
      requireRole,
    }),
    [user, isLoading, logout, loadUser, requireRole],
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
