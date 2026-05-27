"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Job } from "@/types/job";
import { useJobRoleContent, type JobRoleResponsibility } from "@/lib/job-role-content";
import {
  ArrowLeft,
  Share2,
  Bookmark,
  MapPin,
  Clock,
  Briefcase,
  Building2,
  Star,
  CheckCircle2,
  Bike,
  Car,
  Zap,
  ChefHat,
  Shield,
  Sparkles,
  Keyboard,
  Wrench,
} from "lucide-react";

import "@/lib/i18n";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { LoginRequiredModal } from "@/components/LoginRequiredModal";
import { SectionLoader } from "@/components/ui/Spinner";

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

export function JobDetailPage({ jobId }: { jobId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["public-job", jobId],
    queryFn: () => api.getPublicJob(jobId),
    retry: false,
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-soft">
        <Navbar />
        <SectionLoader label={t("common.loading")} className="min-h-[50vh]" />
        <Footer />
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold text-ink">{t("pages.jobDetail.notFound")}</h1>
          <Link
            href="/jobs"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" /> {t("pages.jobDetail.backToJobs")}
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <JobDetailContent
      job={job}
      loginOpen={loginOpen}
      onCloseLogin={() => setLoginOpen(false)}
      onRequireLogin={() => setLoginOpen(true)}
      router={router}
    />
  );
}

function JobDetailContent({
  job,
  onRequireLogin,
  loginOpen,
  onCloseLogin,
  router,
}: {
  job: Job;
  onRequireLogin: () => void;
  loginOpen: boolean;
  onCloseLogin: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const isSeeker = user?.user_type === "seeker";

  const { data: status } = useQuery({
    queryKey: ["job-application-status", job.id],
    queryFn: () => api.getJobApplicationStatus(job.id),
    enabled: !!user && isSeeker,
    retry: false,
  });

  const [applied, setApplied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const hasApplied = applied || status?.applied === true;
  const hasSaved = bookmarked || status?.bookmarked === true;

  const handleApply = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    if (user.user_type !== "seeker") {
      toast.error(t("pages.jobDetail.applyFailed"));
      return;
    }
    if (hasApplied) return;
    setApplyBusy(true);
    try {
      const res = await api.applyToJob(job.id);
      setApplied(true);
      toast.success(t("pages.jobDetail.applySuccess"));
      if (res.applied) {
        qc.invalidateQueries({ queryKey: ["job-application-status", job.id] });
        qc.invalidateQueries({ queryKey: ["public-job", job.id] });
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      if (msg === "Already applied" || (typeof msg === "string" && msg.toLowerCase().includes("already"))) {
        setApplied(true);
      } else {
        toast.error(typeof msg === "string" ? msg : t("pages.jobDetail.applyFailed"));
      }
    } finally {
      setApplyBusy(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    if (user.user_type !== "seeker") {
      onRequireLogin();
      return;
    }
    setSaveBusy(true);
    try {
      if (hasSaved) {
        await api.unbookmarkJob(job.id);
        setBookmarked(false);
        toast.success(t("dashboard.saved.remove"));
      } else {
        await api.bookmarkJob(job.id);
        setBookmarked(true);
        toast.success(t("pages.jobs.bookmark"));
      }
      qc.invalidateQueries({ queryKey: ["job-application-status", job.id] });
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    } catch {
      toast.error(t("toast.otpFailed"));
    } finally {
      setSaveBusy(false);
    }
  };

  const handleSaveClick = () => {
    if (!user || !isSeeker) {
      onRequireLogin();
      return;
    }
    void handleSave();
  };
  const roleContent = useJobRoleContent(job.roleKey);
  const roleLabel = t(`roles.${job.roleKey}`);
  const RoleIcon = ROLE_ICONS[job.roleKey] ?? Briefcase;
  const initials = job.company
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const industry = job.industry ?? roleContent.industry;
  const skills = job.skills?.length ? job.skills : roleContent.skills;
  const education = job.education ?? roleContent.education;
  const hours = job.hours ?? roleContent.hours;
  const shifts = job.shifts?.length ? job.shifts : roleContent.shifts;
  const requirements = job.requirements?.length ? job.requirements : roleContent.requirements;
  const responsibilities = resolveResponsibilities(job, roleContent.responsibilities);
  const benefits = t("pages.jobDetail.benefitsList", { returnObjects: true }) as string[];

  const postedDate = new Date();
  postedDate.setDate(postedDate.getDate() - job.postedDays);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30 - job.postedDays);
  const daysLeft = Math.max(0, 30 - job.postedDays);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const openingsLabel =
    job.openings > 1
      ? t("pages.jobDetail.openings_other", { n: job.openings })
      : t("pages.jobDetail.openings_one", { n: job.openings });

  return (
    <main className="min-h-screen bg-soft">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> {t("pages.jobDetail.backToJobs")}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t("pages.jobDetail.share")}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink hover:border-primary hover:text-primary"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={saveBusy || authLoading}
              aria-label={t("pages.jobDetail.save")}
              className={`grid h-9 w-9 place-items-center rounded-full border bg-white transition hover:border-primary hover:text-primary ${
                hasSaved ? "border-primary text-primary" : "border-line text-ink"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${hasSaved ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-primary text-lg font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">{roleLabel}</h1>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" /> {job.company}
                  </p>
                  {job.urgent && (
                    <div className="mt-2">
                      <span className="rounded-md bg-orange px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        {t("pages.jobDetail.urgent")}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" /> {job.city}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-primary" /> {t(`pages.jobs.type.${job.type}`)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" /> {t(`pages.jobs.exp.${job.expKey}`)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("pages.jobDetail.posted", { date: fmtDate(postedDate) })}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold text-ink">{t("pages.jobDetail.descriptionTitle")}</h2>
              <div className="mt-4 space-y-5 text-sm leading-relaxed text-ink/90">
                <p>
                  {job.description ??
                    t("pages.jobDetail.descriptionLead", {
                      role: roleLabel,
                      company: job.company,
                      city: job.city,
                      openings: openingsLabel,
                    })}
                </p>
                <div>
                  <p className="font-bold">{t("pages.jobDetail.keyResponsibilities")}</p>
                  <ul className="mt-2 space-y-2 pl-5">
                    {responsibilities.map((r, i) => (
                      <li key={i} className="list-disc">
                        {r.title ? (
                          <>
                            <span className="font-semibold">{r.title}:</span> {r.body}
                          </>
                        ) : (
                          r.body
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold">{t("pages.jobDetail.requirements")}</p>
                  <ul className="mt-2 space-y-2 pl-5">
                    {requirements.map((r, i) => (
                      <li key={i} className="list-disc">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold">{t("pages.jobDetail.benefits")}</p>
                  <ul className="mt-2 space-y-2 pl-5">
                    {benefits.map((b, i) => (
                      <li key={i} className="list-disc">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold text-ink">{t("pages.jobDetail.overviewTitle")}</h2>
              <div className="mt-5 grid gap-8 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 border-b border-line pb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-ink">{t("pages.jobDetail.locationDetails")}</p>
                  </div>
                  <dl className="mt-4 space-y-4 text-sm">
                    <FieldRow
                      label={t("pages.jobDetail.address")}
                      value={t("pages.jobDetail.addressValue", { company: job.company, city: job.city })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FieldRow label={t("pages.jobDetail.city")} value={job.city} />
                      <FieldRow label={t("pages.jobDetail.pincode")} value={t("pages.jobDetail.defaultPincode")} />
                    </div>
                    <FieldRow label={t("pages.jobDetail.state")} value={t("pages.jobDetail.defaultState")} />
                  </dl>
                </div>
                <div>
                  <div className="flex items-center gap-2 border-b border-line pb-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-ink">{t("pages.jobDetail.jobDetails")}</p>
                  </div>
                  <dl className="mt-4 space-y-4 text-sm">
                    <FieldRow
                      label={t("pages.jobDetail.salaryRange")}
                      value={t("pages.jobDetail.salaryValue", {
                        min: job.salaryMin.toLocaleString("en-IN"),
                        max: job.salaryMax.toLocaleString("en-IN"),
                      })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FieldRow label={t("pages.jobDetail.jobTitle")} value={roleLabel} />
                      <FieldRow label={t("pages.jobDetail.industryType")} value={industry} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FieldRow label={t("pages.jobDetail.workingHours")} value={hours} />
                      <FieldRow label={t("pages.jobDetail.education")} value={education} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("pages.jobDetail.availableShifts")}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {shifts.map((s) => (
                          <span key={s} className="rounded-md bg-soft px-2.5 py-1 text-xs font-medium text-ink">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <FieldRow label={t("pages.jobDetail.hiringProcess")} value={t("pages.jobDetail.hiringProcessValue")} />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("pages.jobDetail.keySkills")}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {skills.map((s) => (
                          <span key={s} className="rounded-md bg-green/10 px-2.5 py-1 text-xs font-medium text-green">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="space-y-5 lg:sticky lg:top-6">
              <div className="rounded-xl border border-line bg-white p-5">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applyBusy || hasApplied}
                  className={`w-full rounded-md py-3 text-sm font-bold text-white transition ${
                    hasApplied
                      ? "cursor-default bg-green hover:bg-green"
                      : "bg-primary hover:bg-primary/90 disabled:opacity-70"
                  }`}
                >
                  {applyBusy
                    ? t("pages.jobDetail.applying")
                    : hasApplied
                      ? t("pages.jobDetail.applied")
                      : t("pages.jobDetail.applyNow")}
                </button>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={saveBusy}
                  className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border py-3 text-sm font-semibold transition ${
                    hasSaved
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-line bg-white text-ink hover:border-primary hover:text-primary"
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${hasSaved ? "fill-current" : ""}`} />
                  {hasSaved ? t("pages.jobDetail.saved") : t("pages.jobDetail.saveJob")}
                </button>
                <div className="mt-5 space-y-4 border-t border-line pt-5 text-sm">
                  <Row
                    label={t("pages.jobDetail.deadline")}
                    value={t("pages.jobDetail.deadlineValue", { date: fmtDate(deadline), days: daysLeft })}
                  />
                  <Row
                    label={t("pages.jobDetail.jobType")}
                    value={
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {t(`pages.jobs.type.${job.type}`)}
                      </span>
                    }
                  />
                  <Row
                    label={t("pages.jobDetail.applicationActivity")}
                    value={t("pages.jobDetail.applicationActivityValue", { n: job.applied })}
                  />
                  <Row label={t("pages.jobDetail.opening")} value={String(job.openings)} />
                </div>
              </div>

              <div className="rounded-xl border border-line bg-white p-5">
                <h3 className="font-display text-base font-bold text-ink">{t("pages.jobDetail.reviewsTitle")}</h3>
                <div className="mt-3 rounded-lg border border-line bg-soft/40 p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RoleIcon className="h-3.5 w-3.5 text-primary" />
                    {t("pages.jobDetail.lakshyaRating")}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Star className="h-5 w-5 fill-orange text-orange" />
                    <span className="font-semibold text-ink">{t("pages.jobDetail.notAvailable")}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t("pages.jobDetail.reviewsCount")}</p>
                  <a className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline" href="#">
                    {t("pages.jobDetail.viewReviews")}
                  </a>
                </div>
              </div>

              {job.verified && (
                <div className="flex items-center gap-2 rounded-xl border border-green/30 bg-green/5 p-4 text-sm text-green">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("pages.jobDetail.verifiedEmployer")}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <LoginRequiredModal open={loginOpen} onClose={onCloseLogin} returnTo={`/jobs/${job.id}`} />
      <Footer />
    </main>
  );
}

function resolveResponsibilities(job: Job, fallback: JobRoleResponsibility[]): JobRoleResponsibility[] {
  if (!job.responsibilities?.length) return fallback;
  return job.responsibilities.map((r) => {
    if (typeof r === "string") return { title: "", body: r };
    return r as JobRoleResponsibility;
  });
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold text-ink">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-ink">{value}</p>
    </div>
  );
}
