"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ADMIN_DASHBOARD_LOGOUT, ADMIN_DASHBOARD_NAV } from "@/lib/admin-nav";
import { isSuperAdmin } from "@/lib/admin-auth";
import { useAuth } from "@/hooks/useAuth";

function isActive(pathname: string, href: string) {
  if (href === "/admin-dashboard") return pathname === "/admin-dashboard";
  return pathname.startsWith(href);
}

export function AdminDashboardSidebar() {
  const pathname = usePathname() ?? "/admin-dashboard";
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const LogoutIcon = ADMIN_DASHBOARD_LOGOUT.icon;

  const items = ADMIN_DASHBOARD_NAV.filter(
    (item) => item.mobile !== false && (!item.superAdminOnly || superAdmin),
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
        <Link href="/admin-dashboard">
          <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={120} height={48} className="h-10 w-auto" />
        </Link>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                active ? "bg-primary text-white shadow-sm" : "text-ink/80 hover:bg-soft hover:text-primary"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
        <div className="mt-auto border-t border-line pt-3">
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/80 transition hover:bg-red/10 hover:text-red"
          >
            <LogoutIcon className="h-5 w-5" />
            {t(ADMIN_DASHBOARD_LOGOUT.labelKey)}
          </button>
        </div>
      </nav>
    </aside>
  );
}
