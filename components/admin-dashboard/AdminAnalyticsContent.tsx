"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { AdminStatCards } from "@/components/admin/AdminStatCards";
import { AdminAnalyticsCharts } from "@/components/admin/AdminAnalyticsCharts";
import "@/lib/i18n";

export function AdminAnalyticsContent() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api.getAdminAnalytics(),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("adminDashboard.analytics.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("adminDashboard.analytics.subtitle")}</p>
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
          <AdminAnalyticsCharts data={data} />
        </>
      )}
    </div>
  );
}
