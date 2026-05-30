"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Bike,
  Car,
  Zap,
  ChefHat,
  Shield,
  Sparkles,
  Keyboard,
  Wrench,
  Briefcase,
  Clock,
  Award,
  MapPin,
  IndianRupee,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  SlidersHorizontal,
  Calendar,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LakshyaDatePicker } from "@/components/ui/LakshyaDatePicker";
import { api } from "@/lib/api";
import type { Job } from "@/types/job";
import { formatScheduledAt, getJobScheduleInfo } from "@/lib/job-schedule";
import { SeekersHero } from "@/components/landing/SeekersHero";
import { JobCardHeading } from "@/components/jobs/job-card-heading";
import { config } from "@/lib/config";
import "@/lib/i18n";

const ROLE_OPTIONS = ["delivery", "driver", "electrician", "cook", "security", "cleaner", "dataEntry", "welder"];
const TYPE_OPTIONS = ["fullTime", "partTime"] as const;
const EXP_OPTIONS = ["fresher", "exp12", "exp35"] as const;
const ROLE_ICONS: Record<string, typeof Bike> = {
  delivery: Bike,
  driver: Car,
  electrician: Zap,
  cook: ChefHat,
  security: Shield,
  cleaner: Sparkles,
  dataEntry: Keyboard,
  welder: Wrench,
};

type JobTab = "active" | "drafts" | "closed";

function defaultReactivateDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDeadline(value?: string) {
  if (!value?.trim()) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) return value;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function ProviderJobManagementContent() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [draftRole, setDraftRole] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftType, setDraftType] = useState("");
  const [draftExp, setDraftExp] = useState("");
  const [appliedRole, setAppliedRole] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [appliedType, setAppliedType] = useState("");
  const [appliedExp, setAppliedExp] = useState("");
  const [jobTab, setJobTab] = useState<JobTab>("active");
  const [reactivateJob, setReactivateJob] = useState<Job | null>(null);
  const [reactivateDeadline, setReactivateDeadline] = useState(defaultReactivateDeadline);

  const { data, isLoading } = useQuery({
    queryKey: ["provider-jobs", "list"],
    queryFn: () => api.listProviderJobs({ limit: 100 }),
  });

  const jobs = data?.jobs ?? [];
  const facts = t("pages.jobs.facts", { returnObjects: true }) as { k: string; v: string }[];
  const highlights = t("pages.jobs.strip", { returnObjects: true }) as { k: string; v: string }[];
  const roleKeys = useMemo(() => {
    const dynamic = Array.from(new Set(jobs.map((j) => j.roleKey))).filter(Boolean);
    return dynamic.length ? Array.from(new Set([...ROLE_OPTIONS, ...dynamic])) : ROLE_OPTIONS;
  }, [jobs]);
  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const draftJobs = jobs.filter((j) => (j.status ?? "").toLowerCase() === "draft").length;
  const closedJobs = jobs.filter((j) => j.status === "closed").length;
  const totalApplicants = jobs.reduce((acc, j) => acc + (j.applied ?? 0), 0);
  const tabJobs = useMemo(() => {
    if (jobTab === "closed") return jobs.filter((job) => job.status === "closed");
    if (jobTab === "drafts") return jobs.filter((job) => (job.status ?? "").toLowerCase() === "draft");
    return jobs.filter((job) => job.status === "active");
  }, [jobs, jobTab]);
  const filteredJobs = useMemo(
    () =>
      tabJobs.filter((job) => {
        if (appliedRole && job.roleKey !== appliedRole) return false;
        if (appliedCity && !job.city.toLowerCase().includes(appliedCity.toLowerCase())) return false;
        if (appliedType && job.type !== appliedType) return false;
        if (appliedExp && job.expKey !== appliedExp) return false;
        return true;
      }),
    [tabJobs, appliedRole, appliedCity, appliedType, appliedExp],
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProviderJob(id),
    onSuccess: () => {
      toast.success(t("providerDashboard.jobManagement.deleted", { defaultValue: "Job deleted" }));
      queryClient.invalidateQueries({ queryKey: ["provider-jobs", "list"] });
    },
    onError: () => {
      toast.error(t("providerDashboard.jobManagement.deleteFailed", { defaultValue: "Failed to delete job" }));
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.updateProviderJob(id, { status: "active" }),
    onSuccess: () => {
      toast.success(t("providerDashboard.jobManagement.published", { defaultValue: "Job published" }));
      queryClient.invalidateQueries({ queryKey: ["provider-jobs", "list"] });
    },
    onError: () => {
      toast.error(t("providerDashboard.jobManagement.publishFailed", { defaultValue: "Failed to publish job" }));
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.updateProviderJob(id, { status: "closed" }),
    onSuccess: () => {
      toast.success(t("providerDashboard.jobManagement.closed", { defaultValue: "Job closed" }));
      queryClient.invalidateQueries({ queryKey: ["provider-jobs", "list"] });
    },
    onError: () => {
      toast.error(t("providerDashboard.jobManagement.closeFailed", { defaultValue: "Failed to close job" }));
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: ({ id, application_deadline }: { id: string; application_deadline: string }) =>
      api.updateProviderJob(id, { status: "active", application_deadline }),
    onSuccess: () => {
      toast.success(t("providerDashboard.jobManagement.reactivated", { defaultValue: "Job is active again" }));
      setReactivateJob(null);
      queryClient.invalidateQueries({ queryKey: ["provider-jobs", "list"] });
    },
    onError: () => {
      toast.error(t("providerDashboard.jobManagement.reactivateFailed", { defaultValue: "Could not reactivate job" }));
    },
  });

  const openReactivate = (job: Job) => {
    setReactivateDeadline(defaultReactivateDeadline());
    setReactivateJob(job);
  };

  const submitReactivate = () => {
    if (!reactivateJob) return;
    if (!reactivateDeadline.trim()) {
      toast.error(t("providerDashboard.jobManagement.deadlineRequired"));
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (reactivateDeadline.slice(0, 10) < today) {
      toast.error(t("providerDashboard.jobManagement.deadlineFuture"));
      return;
    }
    reactivateMutation.mutate({ id: reactivateJob.id, application_deadline: reactivateDeadline.slice(0, 10) });
  };

  const clearDraftFilters = () => {
    setDraftRole("");
    setDraftCity("");
    setDraftType("");
    setDraftExp("");
  };

  const applyFilters = () => {
    setAppliedRole(draftRole);
    setAppliedCity(draftCity);
    setAppliedType(draftType);
    setAppliedExp(draftExp);
    setFilterSheetOpen(false);
  };

  const stats = useMemo(
    () => [
      {
        key: "total",
        icon: <Briefcase className="h-4 w-4 text-primary" />,
        value: jobs.length,
        label: t("providerDashboard.jobManagement.stats.total", { defaultValue: "Total jobs posted" }),
      },
      {
        key: "active",
        icon: <Award className="h-4 w-4 text-green" />,
        value: activeJobs,
        label: t("providerDashboard.jobManagement.stats.active", { defaultValue: "Active jobs" }),
      },
      {
        key: "applicants",
        icon: <Briefcase className="h-4 w-4 text-primary" />,
        value: totalApplicants,
        label: t("providerDashboard.jobManagement.stats.applicants", { defaultValue: "Total applicants" }),
      },
    ],
    [jobs.length, activeJobs, totalApplicants, t],
  );

  return (
    <div className="bg-soft">
      <div className="mx-auto grid max-w-7xl gap-6 px-1 py-2 lg:grid-cols-12">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pr-1">
            <JobFiltersBox
              t={t}
              roleKeys={roleKeys}
              role={draftRole}
              setRole={setDraftRole}
              city={draftCity}
              setCity={setDraftCity}
              jobType={draftType}
              setJobType={setDraftType}
              exp={draftExp}
              setExp={setDraftExp}
              onClear={clearDraftFilters}
              onApply={applyFilters}
            />

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

        <div className="seekers-scroll lg:col-span-9 lg:h-[calc(100vh-4rem)] lg:overflow-y-scroll lg:pr-2">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary lg:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("pages.jobs.kicker", { count: filteredJobs.length })}
          </p>

          <SeekersHero
            title={t("pages.jobs.title")}
            subtitle={t("pages.jobs.subtitle")}
            facts={facts}
            strip={highlights}
          />

          <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">
              {t("pages.jobs.results.count", { n: filteredJobs.length })}
            </p>
            <div className="text-xs text-muted-foreground">
              {t("providerDashboard.jobManagement.stats.total", { defaultValue: "Total jobs posted" })}:{" "}
              <span className="font-semibold text-ink">{jobs.length}</span>{" "}
              • {t("providerDashboard.jobManagement.stats.active", { defaultValue: "Active jobs" })}:{" "}
              <span className="font-semibold text-ink">{activeJobs}</span>{" "}
              • {t("providerDashboard.jobManagement.tabs.drafts", { defaultValue: "Drafts" })}:{" "}
              <span className="font-semibold text-ink">{draftJobs}</span>{" "}
              • {t("providerDashboard.jobManagement.tabs.closed", { defaultValue: "Closed jobs" })}:{" "}
              <span className="font-semibold text-ink">{closedJobs}</span>{" "}
              • {t("providerDashboard.jobManagement.stats.applicants", { defaultValue: "Total applicants" })}:{" "}
              <span className="font-semibold text-ink">{totalApplicants}</span>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 border-b border-line">
            {(["active", "drafts", "closed"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setJobTab(tab)}
                className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                  jobTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-ink"
                }`}
              >
                {t(`providerDashboard.jobManagement.tabs.${tab}`, {
                  defaultValue:
                    tab === "active" ? "Active" : tab === "drafts" ? "Drafts" : "Closed jobs",
                })}
                <span className="ml-1.5 rounded-full bg-soft px-2 py-0.5 text-xs font-bold text-ink">
                  {tab === "closed" ? closedJobs : tab === "drafts" ? draftJobs : activeJobs}
                </span>
              </button>
            ))}
          </div>

          <Link
            href="/provider-dashboard/job-management/post"
            className="mb-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t("providerDashboard.jobManagement.postNew", { defaultValue: "Post New Job" })}
          </Link>

          {isLoading ? (
            <section className="rounded-xl border border-line bg-white p-8 text-center shadow-sm sm:p-10">{t("common.loading")}</section>
          ) : filteredJobs.length === 0 ? (
            <section className="rounded-xl border border-line bg-white p-8 text-center shadow-sm sm:p-10">
              <p className="font-display text-xl font-bold text-ink">
                {jobTab === "closed"
                  ? t("providerDashboard.jobManagement.emptyClosedTitle", { defaultValue: "No closed jobs" })
                  : jobTab === "drafts"
                    ? t("providerDashboard.jobManagement.emptyDraftTitle", { defaultValue: "No draft jobs" })
                    : t("providerDashboard.jobManagement.emptyActiveTitle", {
                        defaultValue: "No active jobs",
                      })}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {jobTab === "closed"
                  ? t("providerDashboard.jobManagement.emptyClosedBody", {
                      defaultValue:
                        "Jobs you close manually or after the application deadline passes will appear here.",
                    })
                  : jobTab === "drafts"
                    ? t("providerDashboard.jobManagement.emptyDraftBody", {
                        defaultValue: "Saved drafts and scheduled jobs waiting to go live will appear here.",
                      })
                    : t("providerDashboard.jobManagement.emptyActiveBody", {
                        defaultValue: "Publish a job or reactivate a closed listing to see it here.",
                      })}
              </p>
            </section>
          ) : (
            <ul className="space-y-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  viewHref={`/jobs/${job.id}`}
                  editHref={`/provider-dashboard/job-management/post/${job.id}`}
                  onPublish={() => {
                    if (
                      confirm(
                        t("providerDashboard.jobManagement.confirmPublish", {
                          defaultValue: "Publish this job? It will appear on the public jobs page for seekers.",
                        }),
                      )
                    ) {
                      publishMutation.mutate(job.id);
                    }
                  }}
                  onClose={() => {
                    if (
                      confirm(
                        t("providerDashboard.jobManagement.confirmClose", {
                          defaultValue: "Close this job? It will be hidden from seekers.",
                        }),
                      )
                    ) {
                      closeMutation.mutate(job.id);
                    }
                  }}
                  onDelete={() => {
                    if (confirm(t("providerDashboard.jobManagement.confirmDelete", { defaultValue: "Delete this job?" }))) {
                      deleteMutation.mutate(job.id);
                    }
                  }}
                  onReactivate={() => openReactivate(job)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="fixed right-4 top-16 z-30 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-lg ring-1 ring-line hover:text-primary lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("pages.jobs.filters.title")}
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-0">
          <SheetHeader className="border-b border-line px-5 py-4 text-left">
            <SheetTitle className="font-display text-base font-bold text-ink">
              {t("pages.jobs.filters.title")}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <JobFiltersBox
              t={t}
              roleKeys={roleKeys}
              role={draftRole}
              setRole={setDraftRole}
              city={draftCity}
              setCity={setDraftCity}
              jobType={draftType}
              setJobType={setDraftType}
              exp={draftExp}
              setExp={setDraftExp}
              onClear={clearDraftFilters}
              onApply={applyFilters}
            />
          </div>
        </SheetContent>
      </Sheet>

      {reactivateJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  {t("providerDashboard.jobManagement.reactivateTitle", { defaultValue: "Reactivate job" })}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("providerDashboard.jobManagement.reactivateBody", {
                    defaultValue: "Set a new application deadline to make this job live again for seekers.",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReactivateJob(null)}
                className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted-foreground hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm font-semibold text-ink">
              {reactivateJob.title || t(`roles.${reactivateJob.roleKey}`, { defaultValue: reactivateJob.roleKey })}
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("providerDashboard.jobManagement.applicationDeadline", { defaultValue: "Application deadline" })}
              </span>
              <LakshyaDatePicker
                value={reactivateDeadline}
                onChange={setReactivateDeadline}
                disableBefore={startOfToday()}
                placeholder={t("providerDashboard.postJob.fields.deadline")}
              />
            </label>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={reactivateMutation.isPending}
                onClick={submitReactivate}
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {reactivateMutation.isPending
                  ? t("dashboard.profile.saving")
                  : t("providerDashboard.jobManagement.reactivateConfirm", { defaultValue: "Activate job" })}
              </button>
              <button
                type="button"
                disabled={reactivateMutation.isPending}
                onClick={() => setReactivateJob(null)}
                className="rounded-md border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-soft"
              >
                {t("dashboard.profile.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`.lk-input{width:100%;border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:14px;background:#fff;color:var(--ink);outline:none}.lk-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(27,82,164,.12)}.seekers-scroll::-webkit-scrollbar{width:6px}.seekers-scroll::-webkit-scrollbar-track{background:#f1f5f9;border-radius:999px}.seekers-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}.seekers-scroll::-webkit-scrollbar-thumb:hover{background:#94a3b8}.seekers-scroll{scrollbar-width:thin;scrollbar-color:#cbd5e1 #f1f5f9}.dropdown-scroll::-webkit-scrollbar{width:3px}.dropdown-scroll::-webkit-scrollbar-track{background:transparent}.dropdown-scroll::-webkit-scrollbar-thumb{background:#d7dee8;border-radius:999px}.dropdown-scroll{scrollbar-width:thin;scrollbar-color:#d7dee8 transparent}`}</style>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function JobFiltersBox({
  t,
  roleKeys,
  role,
  setRole,
  city,
  setCity,
  jobType,
  setJobType,
  exp,
  setExp,
  onClear,
  onApply,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  roleKeys: string[];
  role: string;
  setRole: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  jobType: string;
  setJobType: (v: string) => void;
  exp: string;
  setExp: (v: string) => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [expMenuOpen, setExpMenuOpen] = useState(false);
  const closeMenus = () => {
    setRoleMenuOpen(false);
    setTypeMenuOpen(false);
    setExpMenuOpen(false);
  };
  const selectedRoleLabel = role ? t(`roles.${role}`, { defaultValue: role }) : t("pages.jobs.filters.anyRole");
  const selectedTypeLabel = jobType
    ? t(jobType === "fullTime" ? "pages.jobs.filters.fullTime" : "pages.jobs.filters.partTime")
    : t("pages.jobs.filters.anyType");
  const selectedExpLabel = exp
    ? exp === "fresher"
      ? t("pages.jobs.exp.fresher")
      : exp === "exp12"
      ? t("pages.jobs.exp.exp12")
      : t("pages.jobs.exp.exp35")
    : t("pages.jobs.filters.anyExp");

  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-base font-bold text-ink">{t("pages.jobs.filters.title")}</h2>
        <button type="button" onClick={onClear} className="text-xs font-semibold text-primary hover:underline">
          {t("pages.jobs.filters.clear")}
        </button>
      </div>
      <div className="space-y-5 px-5 py-5">
        <FormRow label={t("pages.jobs.filters.role")}>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setRoleMenuOpen((v) => !v);
                setTypeMenuOpen(false);
                setExpMenuOpen(false);
              }}
              className="lk-input flex items-center justify-between text-left"
            >
              <span>{selectedRoleLabel}</span>
              <span className="text-[11px] font-light text-slate-400">{roleMenuOpen ? "▴" : "▾"}</span>
            </button>
            {roleMenuOpen ? (
              <div
                className="dropdown-scroll absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-white shadow-lg"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setRole("");
                    closeMenus();
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-soft ${role === "" ? "bg-primary/10 font-semibold text-primary" : "text-ink"}`}
                >
                  {t("pages.jobs.filters.anyRole")}
                </button>
                {roleKeys.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRole(r);
                      closeMenus();
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-soft ${role === r ? "bg-primary/10 font-semibold text-primary" : "text-ink"}`}
                  >
                    {t(`roles.${r}`, { defaultValue: r })}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </FormRow>
        <FormRow label={t("pages.jobs.filters.location")}>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("pages.jobs.filters.locationPh")} className="lk-input" />
        </FormRow>
        <FormRow label={t("pages.jobs.filters.type")}>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setTypeMenuOpen((v) => !v);
                setRoleMenuOpen(false);
                setExpMenuOpen(false);
              }}
              className="lk-input flex items-center justify-between text-left"
            >
              <span>{selectedTypeLabel}</span>
              <span className="text-[11px] font-light text-slate-400">{typeMenuOpen ? "▴" : "▾"}</span>
            </button>
            {typeMenuOpen ? (
              <div
                className="dropdown-scroll absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-white shadow-lg"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {[
                  { value: "", label: t("pages.jobs.filters.anyType") },
                  { value: "fullTime", label: t("pages.jobs.filters.fullTime") },
                  { value: "partTime", label: t("pages.jobs.filters.partTime") },
                ].map((opt) => (
                  <button
                    key={opt.value || "any"}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setJobType(opt.value);
                      closeMenus();
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-soft ${jobType === opt.value ? "bg-primary/10 font-semibold text-primary" : "text-ink"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </FormRow>
        <FormRow label={t("pages.jobs.filters.exp")}>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setExpMenuOpen((v) => !v);
                setRoleMenuOpen(false);
                setTypeMenuOpen(false);
              }}
              className="lk-input flex items-center justify-between text-left"
            >
              <span>{selectedExpLabel}</span>
              <span className="text-[11px] font-light text-slate-400">{expMenuOpen ? "▴" : "▾"}</span>
            </button>
            {expMenuOpen ? (
              <div
                className="dropdown-scroll absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-white shadow-lg"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {[
                  { value: "", label: t("pages.jobs.filters.anyExp", { defaultValue: "Any Experience" }) },
                  { value: "fresher", label: t("pages.jobs.exp.fresher") },
                  { value: "exp12", label: t("pages.jobs.exp.exp12") },
                  { value: "exp35", label: t("pages.jobs.exp.exp35") },
                ].map((opt) => (
                  <button
                    key={opt.value || "any"}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExp(opt.value);
                      closeMenus();
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-soft ${exp === opt.value ? "bg-primary/10 font-semibold text-primary" : "text-ink"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </FormRow>
        <button type="button" onClick={onApply} className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90">
          {t("pages.jobs.filters.apply")}
        </button>
      </div>
    </div>
  );
}

function JobCard({
  job,
  viewHref,
  editHref,
  onPublish,
  onClose,
  onDelete,
  onReactivate,
}: {
  job: Job;
  viewHref: string;
  editHref: string;
  onPublish: () => void;
  onClose: () => void;
  onDelete: () => void;
  onReactivate: () => void;
}) {
  const { t, i18n } = useTranslation();
  const RoleIcon = ROLE_ICONS[job.roleKey] ?? Briefcase;
  const isActive = (job.status ?? "active") === "active";
  const isDraft = (job.status ?? "").toLowerCase() === "draft";
  const isClosed = job.status === "closed";
  const schedule = getJobScheduleInfo(job);
  const locale = i18n.resolvedLanguage || i18n.language || "en";
  return (
    <li className="group relative rounded-xl border border-line bg-white transition hover:border-primary/40 hover:shadow-lg">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <RoleIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <JobCardHeading job={job} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {job.urgent && (
                <span className="rounded-full bg-orange px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {t("pages.jobs.card.urgent")}
                </span>
              )}
              {job.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green">
                  <Award className="h-3 w-3" />
                  {t("pages.jobs.card.verified")}
                </span>
              )}
              {isClosed && (
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  {t("providerDashboard.jobManagement.statusClosed", { defaultValue: "Closed" })}
                </span>
              )}
              {schedule.isPending && schedule.scheduledAt && (
                <span
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary"
                  title={formatScheduledAt(schedule.scheduledAt, locale)}
                >
                  {t("providerDashboard.jobManagement.statusScheduled", {
                    defaultValue: "Scheduled",
                  })}
                </span>
              )}
              {isDraft && !schedule.isPending && (
                <span className="rounded-full bg-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {t("providerDashboard.jobManagement.statusDraft", { defaultValue: "Draft" })}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isDraft && (
              <button
                type="button"
                onClick={onPublish}
                className="rounded-md border border-primary bg-primary/5 px-2 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
                title={
                  schedule.isPending && schedule.scheduledAt
                    ? t("providerDashboard.jobManagement.publishNowHint", {
                        defaultValue: "Publish immediately instead of waiting for the scheduled time",
                      })
                    : undefined
                }
              >
                {schedule.isPending
                  ? t("providerDashboard.jobManagement.publishNow", { defaultValue: "Publish now" })
                  : t("providerDashboard.jobManagement.publish", { defaultValue: "Publish" })}
              </button>
            )}
            {isClosed && (
              <button
                type="button"
                onClick={onReactivate}
                className="rounded-md border border-green bg-green/5 px-2 py-2 text-xs font-semibold text-green hover:bg-green/10"
                title={t("providerDashboard.jobManagement.reactivate", { defaultValue: "Activate" })}
              >
                {t("providerDashboard.jobManagement.reactivate", { defaultValue: "Activate" })}
              </button>
            )}
            {isActive && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-line px-2 py-2 text-xs font-semibold text-muted-foreground hover:border-orange hover:text-orange"
                title={t("providerDashboard.jobManagement.closeJob", { defaultValue: "Close job" })}
              >
                {t("providerDashboard.jobManagement.closeJob", { defaultValue: "Close" })}
              </button>
            )}
            <Link href={editHref} className="rounded-md border border-line p-2 text-muted-foreground hover:border-primary hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Link>
            <button type="button" onClick={onDelete} className="rounded-md border border-line p-2 text-muted-foreground hover:border-red-500 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-line bg-soft/40 px-4 py-4 sm:px-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <MetaField icon={MapPin} label={t("pages.jobs.card.location")} value={job.city} />
            <MetaField
              icon={IndianRupee}
              label={t("pages.jobs.card.salary")}
              value={`₹${job.salaryMin.toLocaleString("en-IN")} - ₹${job.salaryMax.toLocaleString("en-IN")}${t("pages.jobs.card.perMonth")}`}
            />
            <MetaField icon={Briefcase} label={t("pages.jobs.card.type")} value={t(`pages.jobs.type.${job.type}`)} />
            <MetaField icon={Clock} label={t("pages.jobs.card.exp")} value={t(`pages.jobs.exp.${job.expKey}`)} />
            <MetaField
              icon={Calendar}
              label={t("providerDashboard.jobManagement.applicationDeadline", { defaultValue: "Application deadline" })}
              value={formatDeadline(job.applicationDeadline)}
            />
          </dl>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("pages.jobs.card.posted", { n: job.postedDays })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {t("pages.jobs.card.applied", { n: job.applied })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Award className="h-3 w-3" />
            {t("pages.jobs.card.openings", { n: job.openings })}
          </span>
          {schedule.isPending && schedule.scheduledAt ? (
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <Clock className="h-3 w-3" />
              {t("providerDashboard.jobManagement.goesLiveAt", {
                when: formatScheduledAt(schedule.scheduledAt, locale),
                defaultValue: "Goes live {{when}}",
              })}
            </span>
          ) : null}
        </div>
        <Link href={viewHref} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90">
          {t("pages.jobs.card.view", { defaultValue: "View Details" })}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </li>
  );
}

function MetaField({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
