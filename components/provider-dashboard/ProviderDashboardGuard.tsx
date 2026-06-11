"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/Spinner";
import "@/lib/i18n";

export function ProviderDashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login/provider");
      return;
    }
    if (user.user_type !== "provider") {
      router.replace("/");
      return;
    }
    if (!user.profile_complete) {
      router.replace("/register/provider");
    }
  }, [isLoading, router, user]);

  if ((isLoading && !user) || !user || user.user_type !== "provider" || !user.profile_complete) {
    return <PageLoader label={t("dashboard.loading")} />;
  }

  return <>{children}</>;
}
