"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin } from "@/lib/admin-auth";

export function AdminDashboardTopBar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 sm:h-16 sm:px-6">
      <Link href="/admin-dashboard" className="lg:hidden">
        <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={100} height={40} className="h-8 w-auto" />
      </Link>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-ink">{user?.name || user?.email}</p>
          <p className="text-xs text-muted-foreground">
            {superAdmin ? t("adminDashboard.superAdmin") : t("adminDashboard.admin")}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
