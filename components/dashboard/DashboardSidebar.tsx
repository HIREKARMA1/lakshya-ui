"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SEEKER_DASHBOARD_LOGOUT, SEEKER_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { useAuth } from "@/hooks/useAuth";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function DashboardSidebar() {
  const pathname = usePathname() ?? "/dashboard";
  const { t } = useTranslation();
  const { logout } = useAuth();
  const LogoutIcon = SEEKER_DASHBOARD_LOGOUT.icon;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
        <Link href="/dashboard">
          <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={120} height={48} className="h-10 w-auto" />
        </Link>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
        {SEEKER_DASHBOARD_NAV.filter((item) => item.mobile !== false).map((item) => {
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
          <Link
            href="/dashboard/help"
            className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              isActive(pathname, "/dashboard/help")
                ? "bg-primary text-white"
                : "text-ink/80 hover:bg-soft hover:text-primary"
            }`}
          >
            {(() => {
              const HelpIcon = SEEKER_DASHBOARD_NAV.find((n) => n.id === "help")!.icon;
              return <HelpIcon className="h-5 w-5" />;
            })()}
            {t("dashboard.nav.help")}
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/80 transition hover:bg-red/10 hover:text-red"
          >
            <LogoutIcon className="h-5 w-5" />
            {t(SEEKER_DASHBOARD_LOGOUT.labelKey)}
          </button>
        </div>
      </nav>
    </aside>
  );
}
