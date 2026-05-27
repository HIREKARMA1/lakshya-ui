import type { LucideIcon } from "lucide-react";
import { Bookmark, Briefcase, FileText, HelpCircle, LayoutDashboard, LogOut, User } from "lucide-react";

export type DashboardNavId = "overview" | "jobs" | "saved" | "applications" | "profile" | "help";

export type DashboardNavItem = {
  id: DashboardNavId;
  href: string;
  labelKey: string;
  icon: LucideIcon;
  mobile?: boolean;
};

export const SEEKER_DASHBOARD_NAV: DashboardNavItem[] = [
  { id: "overview", href: "/dashboard", labelKey: "dashboard.nav.overview", icon: LayoutDashboard },
  { id: "jobs", href: "/dashboard/jobs", labelKey: "dashboard.nav.findJobs", icon: Briefcase },
  { id: "saved", href: "/dashboard/saved", labelKey: "dashboard.nav.savedJobs", icon: Bookmark },
  { id: "applications", href: "/dashboard/applications", labelKey: "dashboard.nav.applications", icon: FileText },
  { id: "profile", href: "/dashboard/profile", labelKey: "dashboard.nav.profile", icon: User },
  { id: "help", href: "/dashboard/help", labelKey: "dashboard.nav.help", icon: HelpCircle, mobile: false },
];

export const SEEKER_DASHBOARD_LOGOUT = {
  labelKey: "dashboard.nav.logout",
  icon: LogOut,
} as const;
