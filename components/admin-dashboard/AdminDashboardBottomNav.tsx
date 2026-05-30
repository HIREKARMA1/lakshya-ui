"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ADMIN_DASHBOARD_NAV } from "@/lib/admin-nav";
import { isSuperAdmin } from "@/lib/admin-auth";
import { useAuth } from "@/hooks/useAuth";

function isActive(pathname: string, href: string) {
  if (href === "/admin-dashboard") return pathname === "/admin-dashboard";
  return pathname.startsWith(href);
}

export function AdminDashboardBottomNav() {
  const pathname = usePathname() ?? "/admin-dashboard";
  const { t } = useTranslation();
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);

  const items = ADMIN_DASHBOARD_NAV.filter(
    (item) => item.id !== "admins" && (!item.superAdminOnly || superAdmin),
  ).slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-lg justify-around px-1 py-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-semibold ${
                active ? "text-primary" : "text-ink/60"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
