import { UserManagePanel } from "@/components/admin/UserManagePanel";

export default function AdminSeekersPage() {
  return (
    <UserManagePanel
      kind="seeker"
      titleKey="adminDashboard.seekers.title"
      subtitleKey="adminDashboard.seekers.subtitle"
    />
  );
}
