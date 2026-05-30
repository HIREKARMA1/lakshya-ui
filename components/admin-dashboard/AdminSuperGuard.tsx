"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin } from "@/lib/admin-auth";
import { PageLoader } from "@/components/ui/Spinner";
import { useTranslation } from "react-i18next";

export function AdminSuperGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoading) return;
    if (!isSuperAdmin(user)) {
      router.replace("/admin-dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !isSuperAdmin(user)) {
    return <PageLoader label={t("adminDashboard.loading")} />;
  }

  return <>{children}</>;
}
