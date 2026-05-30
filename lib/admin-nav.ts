import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  Building2,
  Globe2,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  Shield,
  UserCog,
  Users,
} from "lucide-react";

export type AdminDashboardNavId =
  | "overview"
  | "analytics"
  | "workforceHeatmaps"
  | "geoIntelligence"
  | "geoMapping"
  | "jobs"
  | "seekers"
  | "providers"
  | "admins";

export type AdminDashboardNavItem = {
  id: AdminDashboardNavId;
  href: string;
  labelKey: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
  mobile?: boolean;
};

export const ADMIN_DASHBOARD_NAV: AdminDashboardNavItem[] = [
  {
    id: "overview",
    href: "/admin-dashboard",
    labelKey: "adminDashboard.nav.overview",
    icon: LayoutDashboard,
  },
  {
    id: "analytics",
    href: "/admin-dashboard/analytics",
    labelKey: "adminDashboard.nav.analytics",
    icon: BarChart3,
  },
  {
    id: "workforceHeatmaps",
    href: "/admin-dashboard/workforce-heatmaps",
    labelKey: "adminDashboard.nav.workforceHeatmaps",
    icon: Map,
  },
  {
    id: "geoIntelligence",
    href: "/admin-dashboard/geo-intelligence",
    labelKey: "adminDashboard.nav.geoIntelligence",
    icon: Globe2,
    mobile: false,
  },
  {
    id: "geoMapping",
    href: "/admin-dashboard/geo-mapping",
    labelKey: "adminDashboard.nav.geoMapping",
    icon: MapPinned,
    mobile: false,
  },
  {
    id: "jobs",
    href: "/admin-dashboard/jobs",
    labelKey: "adminDashboard.nav.jobs",
    icon: Briefcase,
  },
  {
    id: "seekers",
    href: "/admin-dashboard/seekers",
    labelKey: "adminDashboard.nav.seekers",
    icon: Users,
  },
  {
    id: "providers",
    href: "/admin-dashboard/providers",
    labelKey: "adminDashboard.nav.providers",
    icon: Building2,
  },
  {
    id: "admins",
    href: "/admin-dashboard/admins",
    labelKey: "adminDashboard.nav.admins",
    icon: Shield,
    superAdminOnly: true,
  },
];

export const ADMIN_DASHBOARD_LOGOUT = {
  labelKey: "adminDashboard.nav.logout",
  icon: LogOut,
} as const;

export const ADMIN_ROLE_BADGE = {
  labelKey: "adminDashboard.roleBadge",
  icon: UserCog,
} as const;
