import { ProviderDashboardShell } from "@/components/provider-dashboard/ProviderDashboardShell";

export default function ProviderDashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProviderDashboardShell>{children}</ProviderDashboardShell>;
}
