"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/Spinner";
import "@/lib/i18n";

export function ProviderDashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isSessionReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const hasToken = mounted && api.hasSessionToken();
  const isWorkersNearbyPage = pathname?.startsWith("/provider-dashboard/available-workers");
  const deferToWorkersLoader = isWorkersNearbyPage && hasToken;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isSessionReady) return;
    if (!user && !api.hasSessionToken()) {
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

  if (!mounted) {
    if (isWorkersNearbyPage) return <>{children}</>;
    return <PageLoader label={t("providerDashboard.loading")} variant="section" />;
  }

  if (!isSessionReady || (isLoading && !user) || (!user && hasToken)) {
    if (deferToWorkersLoader) return <>{children}</>;
    return <PageLoader label={t("providerDashboard.loading")} variant="section" />;
  }

  if (!user || user.user_type !== "provider" || !user.profile_complete) {
    if (deferToWorkersLoader && isLoading) return <>{children}</>;
    return <PageLoader label={t("providerDashboard.loading")} variant="section" />;
  }

  return <>{children}</>;
}
