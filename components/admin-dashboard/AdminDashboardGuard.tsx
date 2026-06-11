"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@/lib/admin-auth";
import { PageLoader } from "@/components/ui/Spinner";
import "@/lib/i18n";

export function AdminDashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login/admin");
      return;
    }
    if (!isAdminUser(user)) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if ((isLoading && !user) || !user || !isAdminUser(user)) {
    return <PageLoader label={t("adminDashboard.loading")} />;
  }

  return <>{children}</>;
}
