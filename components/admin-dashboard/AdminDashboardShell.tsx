"use client";

import { AdminDashboardBottomNav } from "./AdminDashboardBottomNav";
import { AdminDashboardGuard } from "./AdminDashboardGuard";
import { AdminDashboardSidebar } from "./AdminDashboardSidebar";
import { AdminDashboardTopBar } from "./AdminDashboardTopBar";

export function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardGuard>
      <div className="flex h-[100dvh] overflow-hidden bg-[#f4f6f9]">
        <AdminDashboardSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-16 lg:pb-0 lg:pl-64">
          <AdminDashboardTopBar />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">{children}</main>
        </div>
        <AdminDashboardBottomNav />
      </div>
    </AdminDashboardGuard>
  );
}
