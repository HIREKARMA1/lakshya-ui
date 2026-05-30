"use client";

import type { AdminAnalyticsOverview } from "@/types/admin";
import { Briefcase, FileText, Building2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AdminStatCards({ overview }: { overview: AdminAnalyticsOverview }) {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Briefcase,
      label: t("adminDashboard.stats.totalJobs"),
      value: overview.total_jobs,
      hint: t("adminDashboard.stats.activeClosed", {
        active: overview.active_jobs,
        closed: overview.closed_jobs,
      }),
      color: "text-primary",
    },
    {
      icon: FileText,
      label: t("adminDashboard.stats.applications"),
      value: overview.total_applications,
      hint: t("adminDashboard.stats.applicationsHint"),
      color: "text-green",
    },
    {
      icon: Users,
      label: t("adminDashboard.stats.seekers"),
      value: overview.total_seekers,
      hint: t("adminDashboard.stats.activeCount", { n: overview.active_seekers }),
      color: "text-orange",
    },
    {
      icon: Building2,
      label: t("adminDashboard.stats.providers"),
      value: overview.total_providers,
      hint: t("adminDashboard.stats.activeCount", { n: overview.active_providers }),
      color: "text-sky",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-extrabold text-ink">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </div>
              <Icon className={`h-8 w-8 ${s.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
