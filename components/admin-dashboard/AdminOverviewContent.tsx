"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { AdminStatCards } from "@/components/admin/AdminStatCards";
import { AdminAnalyticsCharts } from "@/components/admin/AdminAnalyticsCharts";
import "@/lib/i18n";

export function AdminOverviewContent() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api.getAdminAnalytics(),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("adminDashboard.overview.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("adminDashboard.overview.subtitle")}</p>
        </div>
        <Link
          href="/admin-dashboard/analytics"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
        >
          <BarChart3 className="h-4 w-4" />
          {t("adminDashboard.overview.viewAllAnalytics")}
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          {t("adminDashboard.loading")}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
          {t("adminDashboard.loadFailed")}
        </p>
      )}

      {data && (
        <>
          <AdminStatCards overview={data.overview} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t("adminDashboard.duration.avgDaysOpen")}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ink">{data.job_duration.avg_days_open_active}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t("adminDashboard.duration.avgDaysToClose")}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ink">{data.job_duration.avg_days_to_close}</p>
            </div>
          </div>
          <AdminAnalyticsCharts data={data} compact />
        </>
      )}
    </div>
  );
}
