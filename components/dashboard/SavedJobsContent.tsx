"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { JobsListingPanel } from "@/components/jobs/jobs-listing-panel";
import "@/lib/i18n";

export function SavedJobsContent() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => api.listBookmarkedJobs(),
  });

  const { data: myStatus } = useQuery({
    queryKey: ["seeker-jobs-status"],
    queryFn: () => api.getSeekerJobsStatus(),
  });

  const appliedSet = new Set(myStatus?.applied_job_ids ?? []);
  const jobs = useMemo(
    () => (data?.jobs ?? []).filter((j) => !appliedSet.has(j.id)),
    [data?.jobs, myStatus?.applied_job_ids]
  );
  const bookmarkedSet = useMemo(() => new Set(jobs.map((j) => j.id)), [jobs]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["bookmarks"] });
    qc.invalidateQueries({ queryKey: ["seeker-jobs-status"] });
    qc.invalidateQueries({ queryKey: ["applications"] });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <JobsListingPanel
        jobs={jobs}
        isLoading={isLoading}
        filterLayout="inline"
        seekerMode
        hero={{
          title: t("dashboard.saved.title"),
          subtitle: t("dashboard.saved.subtitle"),
        }}
        appliedIds={appliedSet}
        bookmarkedIds={bookmarkedSet}
        onStatusChange={invalidate}
        showMobileKicker={false}
        emptyState={{
          message: t("dashboard.saved.empty"),
          ctaHref: "/dashboard/jobs",
          ctaLabel: t("dashboard.saved.browse"),
        }}
      />
    </div>
  );
}
