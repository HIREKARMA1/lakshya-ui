"use client";

import "@/lib/i18n";
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
  Mail,
  Link2,
} from "lucide-react";

import { config } from "@/lib/config";
import { resolveUploadUrl } from "@/lib/profile-photo-url";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { LoginRequiredModal } from "@/components/LoginRequiredModal";
import { SectionLoader } from "@/components/ui/Spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const isProvider = user?.user_type === "provider";

  const { data: job, isLoading } = useQuery({
    queryKey: ["job-detail", jobId, isProvider],
    queryFn: () => api.fetchJobDetail(jobId, { allowProviderFallback: isProvider }),
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

  const jobStatus = (job.status ?? "active").toLowerCase();
  const isPubliclyVisible = jobStatus === "active";

  return (
    <JobDetailContent
      job={job}
      isProviderPreview={isProvider && !isPubliclyVisible}
      jobStatus={job.status}
      loginOpen={loginOpen}
      onCloseLogin={() => setLoginOpen(false)}
      onRequireLogin={() => setLoginOpen(true)}
      router={router}
    />
  );
}

function JobDetailContent({
  job,
  isProviderPreview,
  jobStatus,
  onRequireLogin,
  loginOpen,
  onCloseLogin,
  router,
}: {
  job: Job;
  isProviderPreview: boolean;
  jobStatus?: string;
  onRequireLogin: () => void;
  loginOpen: boolean;
  onCloseLogin: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const isSeeker = user?.user_type === "seeker";
  const [publishBusy, setPublishBusy] = useState(false);

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
  const roleLabel = t(`roles.${job.roleKey}`, { defaultValue: job.roleKey });
  const jobRoleLabel = t("pages.jobDetail.jobRole", { defaultValue: "Job Role" });
  const titleLabel = job.title?.trim() || roleLabel;
  const companyLogoSrc = resolveUploadUrl(job.companyLogoUrl);
  const companyProfileHref = job.providerId ? `/companies/${job.providerId}` : null;
  const joiningLabel = job.joiningProcess
    ? t(`providerDashboard.postJob.joining.${job.joiningProcess}`, { defaultValue: job.joiningProcess })
    : t("pages.jobDetail.hiringProcessValue");
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

  const handlePublish = async () => {
    setPublishBusy(true);
    try {
      await api.updateProviderJob(job.id, { status: "active" });
      toast.success(t("providerDashboard.jobManagement.published"));
      await qc.invalidateQueries({ queryKey: ["job-detail", job.id] });
      await qc.invalidateQueries({ queryKey: ["provider-jobs", "list"] });
    } catch {
      toast.error(t("providerDashboard.jobManagement.publishFailed"));
    } finally {
      setPublishBusy(false);
    }
  };

  const getJobUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/jobs/${job.id}`;
    }
    return `${config.app.url}/jobs/${job.id}`;
  };

  const buildShareMessage = () =>
    t("pages.jobDetail.shareMessage", {
      title: titleLabel,
      company: job.company,
      city: job.city,
      url: getJobUrl(),
    });

  const handleShareEmail = () => {
    const subject = encodeURIComponent(
      t("pages.jobDetail.shareSubject", { title: titleLabel, company: job.company }),
    );
    const body = encodeURIComponent(buildShareMessage());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(buildShareMessage());
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    const url = getJobUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("pages.jobDetail.linkCopied"));
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success(t("pages.jobDetail.linkCopied"));
      } catch {
        toast.error(t("pages.jobDetail.linkCopyFailed"));
      }
    }
  };

  return (
    <main className="min-h-screen bg-soft">
      <Navbar />

      {isProviderPreview && (
        <div className="border-b border-orange/30 bg-orange/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink">
              {jobStatus === "draft"
                ? t("pages.jobDetail.providerDraftBanner")
                : t("pages.jobDetail.providerNotPublicBanner", { status: jobStatus ?? "" })}
            </p>
            {jobStatus === "draft" && (
              <button
                type="button"
                disabled={publishBusy}
                onClick={() => void handlePublish()}
                className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {publishBusy ? t("pages.jobDetail.publishing") : t("providerDashboard.jobManagement.publish")}
              </button>
            )}
          </div>
        </div>
      )}

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("pages.jobDetail.share")}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink hover:border-primary hover:text-primary"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[11rem]">
                <DropdownMenuItem onSelect={handleShareEmail}>
                  <Mail className="h-4 w-4" />
                  {t("pages.jobDetail.shareViaEmail")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleShareWhatsApp}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4 text-[#25D366]"
                    aria-hidden
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {t("pages.jobDetail.shareViaWhatsApp")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void handleCopyLink()}>
                  <Link2 className="h-4 w-4" />
                  {t("pages.jobDetail.copyLink")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <div className="flex items-start gap-4">
                {companyLogoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={companyLogoSrc}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg border border-line object-cover"
                  />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-primary text-lg font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">{titleLabel}</h1>
                  {job.title?.trim() ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-ink/80">{jobRoleLabel}:</span> {roleLabel}
                    </p>
                  ) : null}
                  <p className="mt-1 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {companyProfileHref ? (
                      <Link
                        href={companyProfileHref}
                        className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-primary"
                      >
                        <Building2 className="h-4 w-4" /> {job.company}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" /> {job.company}
                      </span>
                    )}
                    {companyProfileHref ? (
                      <Link
                        href={companyProfileHref}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {t("pages.jobDetail.viewCompany", { defaultValue: "View Company" })} →
                      </Link>
                    ) : null}
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

            <div className="overflow-hidden rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold text-ink">{t("pages.jobDetail.descriptionTitle")}</h2>
              <div className="mt-4 space-y-5 break-words text-sm leading-relaxed text-ink/90">
                <p className="break-words">
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
                  <ul className="mt-2 list-outside space-y-2 pl-5">
                    {responsibilities.map((r, i) => (
                      <li key={i} className="list-disc break-words">
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
                  <ul className="mt-2 list-outside space-y-2 pl-5">
                    {requirements.map((r, i) => (
                      <li key={i} className="list-disc break-words">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold">{t("pages.jobDetail.benefits")}</p>
                  <ul className="mt-2 list-outside space-y-2 pl-5">
                    {benefits.map((b, i) => (
                      <li key={i} className="list-disc break-words">
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
                      <FieldRow label={t("pages.jobDetail.jobTitle")} value={job.title?.trim() || titleLabel} />
                      <FieldRow label={jobRoleLabel} value={roleLabel} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FieldRow label={t("pages.jobDetail.industryType")} value={industry} />
                      <FieldRow label={t("pages.jobDetail.workingHours")} value={hours} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FieldRow label={t("pages.jobDetail.education")} value={education} />
                      <FieldRow label={t("pages.jobDetail.joiningProcess")} value={joiningLabel} />
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
                {isProviderPreview ? (
                  <>
                    {jobStatus === "draft" && (
                      <button
                        type="button"
                        disabled={publishBusy}
                        onClick={() => void handlePublish()}
                        className="w-full rounded-md bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-70"
                      >
                        {publishBusy ? t("pages.jobDetail.publishing") : t("providerDashboard.jobManagement.publish")}
                      </button>
                    )}
                    <Link
                      href={`/provider-dashboard/job-management/post/${job.id}`}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-line py-3 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
                    >
                      {t("providerDashboard.jobManagement.edit")}
                    </Link>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
