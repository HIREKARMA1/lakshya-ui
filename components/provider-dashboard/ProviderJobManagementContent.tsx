"use client";

import { Briefcase, Plus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

export function ProviderJobManagementContent() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">
            {t("providerDashboard.jobManagement.title", { defaultValue: "Your Job Postings" })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("providerDashboard.jobManagement.subtitle", {
              defaultValue: "Manage and track your active job listings.",
            })}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          {t("providerDashboard.jobManagement.postNew", { defaultValue: "Post New Job" })}
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            key: "total",
            icon: <Briefcase className="h-4 w-4 text-primary" />,
            label: t("providerDashboard.jobManagement.stats.total", { defaultValue: "Total jobs posted" }),
          },
          {
            key: "applicants",
            icon: <Users className="h-4 w-4 text-primary" />,
            label: t("providerDashboard.jobManagement.stats.applicants", { defaultValue: "Total applicants" }),
          },
          {
            key: "onboarded",
            icon: <Users className="h-4 w-4 text-green" />,
            label: t("providerDashboard.jobManagement.stats.onboarded", { defaultValue: "Onboarded" }),
          },
        ].map((item) => (
          <article key={item.key} className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="mb-3">{item.icon}</div>
            <p className="text-3xl font-extrabold text-ink">0</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-line bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="font-display text-xl font-bold text-ink">
          {t("providerDashboard.jobManagement.emptyTitle", { defaultValue: "No job listings yet" })}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("providerDashboard.jobManagement.emptyBody", {
            defaultValue: "Post your first job to get started with candidate matches.",
          })}
        </p>
      </section>
    </div>
  );
}
