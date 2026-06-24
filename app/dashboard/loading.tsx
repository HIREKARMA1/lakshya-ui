"use client";

import { usePathname } from "next/navigation";
import { PageLoader } from "@/components/ui/Spinner";

export default function DashboardLoading() {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard/nearby")) {
    return null;
  }
  return <PageLoader />;
}
