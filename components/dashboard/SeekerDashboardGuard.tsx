"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/Spinner";
import "@/lib/i18n";

export function SeekerDashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isSessionReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const hasToken = mounted && api.hasSessionToken();
  const isNearbyPage = pathname?.startsWith("/dashboard/nearby");
  const deferToNearbyLoader = isNearbyPage && hasToken;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isSessionReady) return;
    if (!user && !api.hasSessionToken()) {
      router.replace("/login/seeker");
      return;
    }
    if (!user) return;
    if (user.user_type !== "seeker") {
      router.replace("/");
      return;
    }
    if (!user.profile_complete) {
      router.replace("/register/seeker");
    }
  }, [isSessionReady, user, router]);

  if (!mounted) {
    if (isNearbyPage) return <>{children}</>;
    return <PageLoader label={t("dashboard.loading")} variant="section" />;
  }

  if (!isSessionReady || (isLoading && !user) || (!user && api.hasSessionToken())) {
    if (deferToNearbyLoader) return <>{children}</>;
    return <PageLoader label={t("dashboard.loading")} variant="section" />;
  }

  if (!user || user.user_type !== "seeker" || !user.profile_complete) {
    if (deferToNearbyLoader && isLoading) return <>{children}</>;
    return <PageLoader label={t("dashboard.loading")} variant="section" />;
  }

  return <>{children}</>;
}
