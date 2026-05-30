import { AdminSuperGuard } from "@/components/admin-dashboard/AdminSuperGuard";
import { UserManagePanel } from "@/components/admin/UserManagePanel";

export default function AdminAdminsPage() {
  return (
    <AdminSuperGuard>
      <UserManagePanel
        kind="admin"
        titleKey="adminDashboard.admins.title"
        subtitleKey="adminDashboard.admins.subtitle"
      />
    </AdminSuperGuard>
  );
}
