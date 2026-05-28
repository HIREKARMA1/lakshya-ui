"use client";

import Link from "next/link";
import { BarChart3, Briefcase, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import "@/lib/i18n";

type Stat = {
  key: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
};

export function ProviderOverviewContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const name =
    user?.provider_profile?.full_name || user?.provider_profile?.legal_name || user?.name || user?.email || "Partner";

  const stats: Stat[] = [
    {
      key: "activeJobs",
      label: t("providerDashboard.overview.stats.activeJobs", { defaultValue: "0" }),
      hint: t("providerDashboard.overview.stats.activeJobsHint", { defaultValue: "Active jobs" }),
      icon: <Briefcase className="h-5 w-5 text-primary" aria-hidden />,
    },
    {
      key: "applications",
      label: t("providerDashboard.overview.stats.applications", { defaultValue: "0" }),
      hint: t("providerDashboard.overview.stats.applicationsHint", { defaultValue: "New applications" }),
      icon: <Users className="h-5 w-5 text-primary" aria-hidden />,
    },
    {
      key: "response",
      label: t("providerDashboard.overview.stats.response", { defaultValue: "N/A" }),
      hint: t("providerDashboard.overview.stats.responseHint", { defaultValue: "Avg. response time" }),
      icon: <BarChart3 className="h-5 w-5 text-primary" aria-hidden />,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-primary">
          {t("providerDashboard.overview.welcome", {
            defaultValue: "Welcome back, {{name}}",
            name,
          })}
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
          {t("providerDashboard.overview.title", { defaultValue: "Provider Overview" })}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("providerDashboard.overview.subtitle", {
            defaultValue: "Track hiring activity and manage team requirements from one place.",
          })}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((item) => (
          <article key={item.key} className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="mb-3">{item.icon}</div>
            <p className="font-display text-2xl font-extrabold text-ink">{item.label}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            {t("providerDashboard.overview.jobManagementTitle", { defaultValue: "Manage your postings" })}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("providerDashboard.overview.jobManagementBody", {
              defaultValue: "Track active, open and closed jobs, and monitor applicants in one place.",
            })}
          </p>
          <Link
            href="/provider-dashboard/job-management"
            className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            {t("providerDashboard.overview.jobManagementCta", { defaultValue: "Open Job Management" })}
          </Link>
        </article>
        <article className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            {t("providerDashboard.overview.seekerFeedTitle", { defaultValue: "Explore more seekers" })}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("providerDashboard.overview.seekerFeedBody", {
              defaultValue: "Search, filter and shortlist candidates from Seeker Feed.",
            })}
          </p>
          <Link
            href="/provider-dashboard/seeker-feed"
            className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            {t("providerDashboard.overview.seekerFeedCta", { defaultValue: "Open Seeker Feed" })}
          </Link>
        </article>
      </section>
    </div>
  );
}
