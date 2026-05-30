"use client";

import type { AdminAnalytics } from "@/types/admin";
import { useTranslation } from "react-i18next";
import {
  ChartCard,
  DualSalaryBarChart,
  SimpleBarChart,
  SimpleLineChart,
  SimplePieChart,
} from "@/components/admin/charts";

export function AdminAnalyticsCharts({ data, compact = false }: { data: AdminAnalytics; compact?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className={`grid gap-4 ${compact ? "md:grid-cols-2" : "lg:grid-cols-2"}`}>
      <ChartCard title={t("adminDashboard.charts.jobsOverTime")}>
        <SimpleLineChart data={data.jobs_over_time} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.applicationsOverTime")}>
        <SimpleLineChart data={data.applications_over_time} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.jobsByStatus")}>
        <SimplePieChart data={data.jobs_by_status} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.applicationsByStatus")}>
        <SimplePieChart data={data.applications_by_status} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.salaryBuckets")}>
        <SimpleBarChart data={data.salary_buckets} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.salaryByRole")}>
        <DualSalaryBarChart data={data.salary_by_role} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.skillsTrends")}>
        <SimpleBarChart data={data.skills_trends} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.experienceJobs")}>
        <SimplePieChart data={data.experience_on_jobs} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.seekerExperience")}>
        <SimpleBarChart data={data.seeker_experience} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.gender")}>
        <SimplePieChart data={data.gender_distribution} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.jobTypes")}>
        <SimplePieChart data={data.job_types} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.daysOpen")}>
        <SimpleBarChart data={data.days_open_histogram} />
      </ChartCard>
      <ChartCard title={t("adminDashboard.charts.selectionFunnel")} className="lg:col-span-2">
        <SimpleBarChart data={data.selection_funnel} />
      </ChartCard>
    </div>
  );
}
