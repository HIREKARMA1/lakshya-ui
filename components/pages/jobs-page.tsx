"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JobsExtras } from "@/components/landing/JobsExtras";
import { LoginRequiredModal } from "@/components/LoginRequiredModal";
import { config } from "@/lib/config";
import { FiltersBox } from "@/components/jobs/filters-box";
import { JobsListingPanel } from "@/components/jobs/jobs-listing-panel";
import { JobsListingStyles } from "@/components/jobs/jobs-listing-styles";
import "@/lib/i18n";

export function JobsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const searchRole = searchParams.get("role") ?? "";
  const { user } = useAuth();
  const qc = useQueryClient();
  const seekerMode = Boolean(user && user.user_type === "seeker");

  const { data: jobsResponse } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: () => api.searchPublicJobs({ limit: 100 }),
    retry: false,
  });
  const JOBS = jobsResponse?.jobs ?? [];
  const roleKeys = useMemo(() => Array.from(new Set(JOBS.map((j) => j.roleKey))), [JOBS]);

  const [role, setRole] = useState(searchRole);
  const [salary, setSalary] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginReturnTo, setLoginReturnTo] = useState<string | null>(null);

  useEffect(() => {
    setRole(searchRole);
  }, [searchRole]);

  const filters = { role, salary, type, location };
  const setters = { setRole, setSalary, setType, setLocation };

  const { data: myStatus } = useQuery({
    queryKey: ["seeker-jobs-status"],
    queryFn: () => api.getSeekerJobsStatus(),
    enabled: seekerMode,
  });

  const appliedSet = new Set(myStatus?.applied_job_ids ?? []);
  const bookmarkedSet = new Set(myStatus?.bookmarked_job_ids ?? []);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["seeker-jobs-status"] });
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-soft">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-12">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1">
              <FiltersBox t={t} roleKeys={roleKeys} filters={filters} setters={setters} />

              <div className="mt-5 overflow-hidden rounded-lg border border-line bg-white">
                <div className="h-1 bg-orange" />
                <div className="px-5 py-5">
                  <p className="font-display text-base font-bold text-ink">{t("pages.jobs.help.title")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("pages.jobs.help.body")}</p>
                  <a
                    href={config.contact.phone ? `tel:${config.contact.phone}` : "#"}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-orange px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {t("pages.jobs.help.cta")}
                  </a>
                </div>
              </div>
            </div>
          </aside>

          <div className="jobs-scroll lg:col-span-9 lg:h-[calc(100vh-3rem)] lg:overflow-y-scroll lg:pr-3">
            <JobsListingPanel
              jobs={JOBS}
              filterLayout="sidebar"
              filterState={filters}
              filterSetters={setters}
              seekerMode={seekerMode}
              appliedIds={appliedSet}
              bookmarkedIds={bookmarkedSet}
              onRequireLogin={(jobId) => {
                setLoginReturnTo(`/jobs/${jobId}`);
                setLoginOpen(true);
              }}
              onStatusChange={invalidate}
              initialRole={searchRole}
            />
          </div>
        </div>
      </section>

      <JobsExtras />
      <Footer />
      <LoginRequiredModal
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          setLoginReturnTo(null);
        }}
        returnTo={loginReturnTo}
      />
      <JobsListingStyles />
    </main>
  );
}
