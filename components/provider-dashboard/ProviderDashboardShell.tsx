"use client";

import { ProviderDashboardBottomNav } from "./ProviderDashboardBottomNav";
import { ProviderDashboardGuard } from "./ProviderDashboardGuard";
import { ProviderDashboardSidebar } from "./ProviderDashboardSidebar";
import { ProviderDashboardTopBar } from "./ProviderDashboardTopBar";

export function ProviderDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ProviderDashboardGuard>
      <div className="flex h-[100dvh] overflow-hidden bg-[#f4f6f9]">
        <ProviderDashboardSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-16 lg:pb-0 lg:pl-64">
          <ProviderDashboardTopBar />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">{children}</main>
        </div>
        <ProviderDashboardBottomNav />
      </div>
    </ProviderDashboardGuard>
  );
}
