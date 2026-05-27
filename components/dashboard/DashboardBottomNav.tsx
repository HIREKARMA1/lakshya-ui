"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SEEKER_DASHBOARD_NAV } from "@/lib/dashboard-nav";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

const MOBILE_ITEMS = SEEKER_DASHBOARD_NAV.filter((n) => n.id !== "help");

export function DashboardBottomNav() {
  const pathname = usePathname() ?? "/dashboard";
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-white px-1 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {MOBILE_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
