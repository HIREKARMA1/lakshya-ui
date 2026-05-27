"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { JobsListingPanel } from "@/components/jobs/jobs-listing-panel";
import "@/lib/i18n";

export function ApplicationsContent() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.listAppliedJobs(),
  });

  const { data: myStatus } = useQuery({
    queryKey: ["seeker-jobs-status"],
    queryFn: () => api.getSeekerJobsStatus(),
  });

  const bookmarkedSet = new Set(myStatus?.bookmarked_job_ids ?? []);
  const jobs = data?.jobs ?? [];
  const appliedSet = useMemo(() => new Set(jobs.map((j) => j.id)), [jobs]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["applications"] });
    qc.invalidateQueries({ queryKey: ["seeker-jobs-status"] });
    qc.invalidateQueries({ queryKey: ["bookmarks"] });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <JobsListingPanel
        jobs={jobs}
        isLoading={isLoading}
        filterLayout="inline"
        seekerMode
        hero={{
          title: t("dashboard.applications.title"),
          subtitle: t("dashboard.applications.subtitle"),
        }}
        appliedIds={appliedSet}
        bookmarkedIds={bookmarkedSet}
        onStatusChange={invalidate}
        showMobileKicker={false}
        emptyState={{
          message: t("dashboard.applications.empty"),
          ctaHref: "/dashboard/jobs",
          ctaLabel: t("dashboard.applications.browse"),
        }}
      />
    </div>
  );
}
