import { UserManagePanel } from "@/components/admin/UserManagePanel";

export default function AdminProvidersPage() {
  return (
    <UserManagePanel
      kind="provider"
      titleKey="adminDashboard.providers.title"
      subtitleKey="adminDashboard.providers.subtitle"
    />
  );
}
