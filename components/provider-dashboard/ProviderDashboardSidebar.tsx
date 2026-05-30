"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PROVIDER_DASHBOARD_LOGOUT, PROVIDER_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { useAuth } from "@/hooks/useAuth";

function isActive(pathname: string, href: string) {
  if (href === "/provider-dashboard") return pathname === "/provider-dashboard";
  return pathname.startsWith(href);
}

export function ProviderDashboardSidebar() {
  const pathname = usePathname() ?? "/provider-dashboard";
  const { t } = useTranslation();
  const { logout } = useAuth();
  const LogoutIcon = PROVIDER_DASHBOARD_LOGOUT.icon;
  const fallbackLabel: Record<string, string> = {
    overview: "Overview",
    jobManagement: "Job Management",
    seekerFeed: "Seeker Feed",
    savedProfiles: "Saved Profiles",
    companyProfile: "Company Profile",
    help: "Help & Support",
  };
  const helpItem = PROVIDER_DASHBOARD_NAV.find((n) => n.id === "help");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
        <Link href="/provider-dashboard">
          <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={120} height={48} className="h-10 w-auto" />
        </Link>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
        {PROVIDER_DASHBOARD_NAV.filter((item) => item.mobile !== false && !item.hidden).map((item) => {
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
              {t(item.labelKey, { defaultValue: fallbackLabel[item.id] ?? item.id })}
            </Link>
          );
        })}
        <div className="mt-auto border-t border-line pt-3">
          {helpItem ? (
            <Link
              href={helpItem.href}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive(pathname, helpItem.href)
                  ? "bg-primary text-white"
                  : "text-ink/80 hover:bg-soft hover:text-primary"
              }`}
            >
              {(() => {
                const HelpIcon = helpItem.icon;
                return <HelpIcon className="h-5 w-5" />;
              })()}
              {t(helpItem.labelKey, { defaultValue: fallbackLabel[helpItem.id] ?? "Help & Support" })}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/80 transition hover:bg-red/10 hover:text-red"
          >
            <LogoutIcon className="h-5 w-5" />
            {t(PROVIDER_DASHBOARD_LOGOUT.labelKey, { defaultValue: "Logout" })}
          </button>
        </div>
      </nav>
    </aside>
  );
}
