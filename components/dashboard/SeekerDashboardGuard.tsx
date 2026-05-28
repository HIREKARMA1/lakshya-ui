"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/Spinner";
import "@/lib/i18n";

export function SeekerDashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login/seeker");
      return;
    }
    if (user.user_type !== "seeker") {
      router.replace("/");
      return;
    }
    if (!user.profile_complete) {
      router.replace("/register/seeker");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.user_type !== "seeker" || !user.profile_complete) {
    return <PageLoader label={t("dashboard.loading")} />;
  }

  return <>{children}</>;
}
