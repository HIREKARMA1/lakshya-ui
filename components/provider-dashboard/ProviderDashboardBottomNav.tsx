"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PROVIDER_DASHBOARD_NAV } from "@/lib/dashboard-nav";

function isActive(pathname: string, href: string) {
  if (href === "/provider-dashboard") return pathname === "/provider-dashboard";
  return pathname.startsWith(href);
}

export function ProviderDashboardBottomNav() {
  const pathname = usePathname() ?? "/provider-dashboard";
  const { t } = useTranslation();
  const fallbackLabel: Record<string, string> = {
    overview: "Overview",
    jobManagement: "Jobs",
    seekerFeed: "Seekers",
    savedProfiles: "Saved",
    companyProfile: "Profile",
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-white px-1 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {PROVIDER_DASHBOARD_NAV.filter((item) => item.mobile !== false).map((item) => {
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
                <span className="truncate">
                  {t(item.labelKey, { defaultValue: fallbackLabel[item.id] ?? item.id })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
