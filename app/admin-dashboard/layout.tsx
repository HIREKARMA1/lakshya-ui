import { AdminDashboardShell } from "@/components/admin-dashboard/AdminDashboardShell";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
