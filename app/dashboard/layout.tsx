import { SeekerDashboardShell } from "@/components/dashboard/SeekerDashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SeekerDashboardShell>{children}</SeekerDashboardShell>;
}
