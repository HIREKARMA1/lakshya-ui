import { AdminSuperGuard } from "@/components/admin-dashboard/AdminSuperGuard";
import { ReferralCodeManagePanel } from "@/components/admin/ReferralCodeManagePanel";

export default function AdminReferralCodesPage() {
  return (
    <AdminSuperGuard>
      <ReferralCodeManagePanel />
    </AdminSuperGuard>
  );
}
