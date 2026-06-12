"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/Spinner";
import "@/lib/i18n";

export function ProviderDashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isSessionReady } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const hasToken = api.hasSessionToken();

  useEffect(() => {
    if (!isSessionReady) return;
    if (!user && !hasToken) {
      router.replace("/login/provider");
      return;
    }
    if (!user) return;
    if (user.user_type !== "provider") {
      router.replace("/");
      return;
    }
    if (!user.profile_complete) {
      router.replace("/register/provider");
    }
  }, [hasToken, isSessionReady, router, user]);

  if (!isSessionReady || (isLoading && !user) || (!user && hasToken)) {
    return <PageLoader label={t("dashboard.loading")} />;
  }

  if (!user || user.user_type !== "provider" || !user.profile_complete) {
    return <PageLoader label={t("dashboard.loading")} />;
  }

  return <>{children}</>;
}
