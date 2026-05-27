"use client";

import { DashboardBottomNav } from "./DashboardBottomNav";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";
import { SeekerDashboardGuard } from "./SeekerDashboardGuard";

export function SeekerDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SeekerDashboardGuard>
      <div className="flex h-[100dvh] overflow-hidden bg-[#f4f6f9]">
        <DashboardSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-16 lg:pb-0 lg:pl-64">
          <DashboardTopBar />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">{children}</main>
        </div>
        <DashboardBottomNav />
      </div>
    </SeekerDashboardGuard>
  );
}
