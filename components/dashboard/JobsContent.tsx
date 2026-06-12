"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthQuery } from "@/hooks/useAuthQuery";
import { api } from "@/lib/api";
import { JobsListingPanel } from "@/components/jobs/jobs-listing-panel";
import "@/lib/i18n";

export function JobsContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get("city") ?? "";
  const initialQ = searchParams.get("q") ?? "";
  const initialRole = searchParams.get("role") ?? "";

  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["public-jobs", "dashboard"],
    queryFn: () => api.searchPublicJobs({ limit: 100 }),
  });

  const { data: myStatus } = useAuthQuery(["seeker-jobs-status"], () => api.getSeekerJobsStatus());

  const appliedSet = new Set(myStatus?.applied_job_ids ?? []);
  const bookmarkedSet = new Set(myStatus?.bookmarked_job_ids ?? []);
  const jobs = useMemo(
    () => (data?.jobs ?? []).filter((j) => !appliedSet.has(j.id)),
    [data?.jobs, myStatus?.applied_job_ids]
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["seeker-jobs-status"] });
    qc.invalidateQueries({ queryKey: ["bookmarks"] });
    qc.invalidateQueries({ queryKey: ["applications"] });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <JobsListingPanel
        jobs={jobs}
        isLoading={isLoading}
        filterLayout="inline"
        seekerMode
        appliedIds={appliedSet}
        bookmarkedIds={bookmarkedSet}
        onStatusChange={invalidate}
        initialRole={initialRole}
        initialLocation={initialCity}
        initialQuery={initialQ}
        showMobileKicker={false}
      />
    </div>
  );
}
