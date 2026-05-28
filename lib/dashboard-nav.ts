import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Briefcase,
  Building2,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  User,
  Users,
} from "lucide-react";

export type DashboardNavId = "overview" | "jobs" | "saved" | "applications" | "profile" | "help";
export type ProviderDashboardNavId =
  | "overview"
  | "jobManagement"
  | "seekerFeed"
  | "savedProfiles"
  | "companyProfile"
  | "help";

export type DashboardNavItem = {
  id: DashboardNavId;
  href: string;
  labelKey: string;
  icon: LucideIcon;
  mobile?: boolean;
};

export type ProviderDashboardNavItem = {
  id: ProviderDashboardNavId;
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

export const PROVIDER_DASHBOARD_NAV: ProviderDashboardNavItem[] = [
  {
    id: "overview",
    href: "/provider-dashboard",
    labelKey: "providerDashboard.nav.overview",
    icon: LayoutDashboard,
  },
  {
    id: "jobManagement",
    href: "/provider-dashboard/job-management",
    labelKey: "providerDashboard.nav.jobManagement",
    icon: Briefcase,
  },
  {
    id: "seekerFeed",
    href: "/provider-dashboard/seeker-feed",
    labelKey: "providerDashboard.nav.seekerFeed",
    icon: Users,
  },
  {
    id: "savedProfiles",
    href: "/provider-dashboard/saved-profiles",
    labelKey: "providerDashboard.nav.savedProfiles",
    icon: Bookmark,
  },
  {
    id: "companyProfile",
    href: "/provider-dashboard/company-profile",
    labelKey: "providerDashboard.nav.companyProfile",
    icon: Building2,
  },
  {
    id: "help",
    href: "/provider-dashboard/help",
    labelKey: "providerDashboard.nav.help",
    icon: HelpCircle,
    mobile: false,
  },
];

export const PROVIDER_DASHBOARD_LOGOUT = {
  labelKey: "providerDashboard.nav.logout",
  icon: LogOut,
} as const;
