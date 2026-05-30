"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AuthUser, UserType } from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const cached = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (cached) {
      try {
        setUser(JSON.parse(cached) as AuthUser);
      } catch {
        setUser(null);
      }
    }
    if (!token) {
      setIsLoading(false);
      return;
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
    loadUser();
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

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refresh: loadUser,
    requireRole,
  };
}
