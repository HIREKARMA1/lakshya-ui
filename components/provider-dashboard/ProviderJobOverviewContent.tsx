"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  IndianRupee,
  Mail,
  MapPin,
  Medal,
  MessageCircle,
  Pencil,
  Phone,
  Save,
  Tag,
  UserPlus,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Job } from "@/types/job";
import { SectionLoader } from "@/components/ui/Spinner";
import "@/lib/i18n";

function formatText(
  raw: string | number | boolean | null | undefined,
  notSpecified: string,
  yesLabel: string,
  noLabel: string,
): string {
  if (typeof raw === "boolean") return raw ? yesLabel : noLabel;
  if (raw === null || raw === undefined) return notSpecified;
  const text = String(raw).trim();
  return text || notSpecified;
}

export function ProviderJobOverviewContent({ jobId }: { jobId: string }) {
  const { t } = useTranslation();

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ["provider-job", jobId],
    queryFn: () => api.getProviderJob(jobId),
    retry: false,
  });

  if (isLoading) {
    return <SectionLoader label={t("common.loading")} className="min-h-[40vh]" />;
  }

  if (isError || !job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display text-xl font-bold text-ink">{t("pages.jobDetail.notFound")}</p>
        <Link
          href="/provider-dashboard/job-management"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("providerDashboard.jobManagement.title")}
        </Link>
      </div>
    );
  }

  return <ProviderJobOverviewView job={job} />;
}

function ProviderJobOverviewView({ job }: { job: Job }) {
  const { t } = useTranslation();
  const notSpecified = t("providerDashboard.postJob.notSpecified");
  const yes = t("common.yes");
  const no = t("common.no");
  const fmt = (raw: string | number | boolean | null | undefined) => formatText(raw, notSpecified, yes, no);

  const extra = job.extra ?? {};
  const expKey = (extra.display_exp_key ?? job.expKey) as string;
  const roleLabel = job.roleKey
    ? t(`roles.${job.roleKey}`, { defaultValue: job.roleKey })
    : notSpecified;
  const titleLabel = job.title?.trim() || notSpecified;
  const industryLabel = job.industry
    ? t(`providerDashboard.postJob.industries.${job.industry}`, { defaultValue: job.industry })
    : notSpecified;
  const employmentLabel = job.employmentLabel
    ? t(`providerDashboard.postJob.employment.${job.employmentLabel}`, { defaultValue: job.employmentLabel })
    : t(`pages.jobs.type.${job.type}`, { defaultValue: job.type });
  const hoursLabel = job.hours?.trim() || notSpecified;
  const shiftsLabel =
    job.shifts && job.shifts.length > 0
      ? job.shifts.map((s) => t(`providerDashboard.postJob.shifts.${s}`, { defaultValue: s })).join(", ")
      : notSpecified;
  const salaryLabel =
    job.salaryMin > 0 || job.salaryMax > 0
      ? `₹${job.salaryMin.toLocaleString("en-IN")} – ₹${job.salaryMax.toLocaleString("en-IN")} / ${t("providerDashboard.postJob.monthly")}`
      : notSpecified;
  const experienceLabel = expKey
    ? t(`providerDashboard.postJob.experience.${expKey}`, { defaultValue: expKey })
    : notSpecified;
  const educationLabel = job.education
    ? t(`providerDashboard.postJob.education.${job.education}`, { defaultValue: job.education })
    : notSpecified;
  const skillsLabel = job.skills && job.skills.length > 0 ? job.skills.join(", ") : notSpecified;
  const benefitsLabel = job.benefits && job.benefits.length > 0 ? job.benefits.join(", ") : notSpecified;
  const joiningLabel = job.joiningProcess
    ? t(`providerDashboard.postJob.joining.${job.joiningProcess}`, { defaultValue: job.joiningProcess })
    : notSpecified;
  const responsibilitiesText =
    job.responsibilities && job.responsibilities.length > 0
      ? job.responsibilities
          .map((r) => (typeof r === "string" ? r : typeof r === "object" && r && "body" in r ? String(r.body) : String(r)))
          .join("\n")
      : notSpecified;
  const publishLabel =
    extra.publishMode === "scheduleLater"
      ? `${t("providerDashboard.postJob.publish.schedule")}${extra.scheduledAt ? ` — ${extra.scheduledAt}` : ` (${notSpecified})`}`
      : t("providerDashboard.postJob.publish.now");
  const questions = extra.questions ?? [];
  const questionsLabel =
    questions.length > 0
      ? questions
          .map((q, i) => {
            const req = q.required ? ` (${t("providerDashboard.postJob.requiredQuestion")})` : "";
            return `${i + 1}. ${q.question.trim() || notSpecified}${req}`;
          })
          .join("\n")
      : notSpecified;

  const statusLabel =
    job.status === "closed"
      ? t("providerDashboard.jobManagement.statusClosed", { defaultValue: "Closed" })
      : job.status === "active"
        ? t("providerDashboard.jobManagement.stats.active", { defaultValue: "Active" })
        : job.status === "draft"
          ? t("providerDashboard.jobManagement.statusDraft", { defaultValue: "Draft" })
          : (job.status ?? "").toUpperCase() || notSpecified;

  const editHref = `/provider-dashboard/job-management/post/${job.id}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/provider-dashboard/job-management"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("providerDashboard.jobManagement.title")}
        </Link>
        <Link
          href={editHref}
          className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
          {t("providerDashboard.jobManagement.edit")}
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-6 sm:px-8">
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {job.title?.trim() || roleLabel}
          </h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {job.company}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {statusLabel}
            </span>
            {job.urgent && (
              <span className="rounded-full bg-orange px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {t("pages.jobs.card.urgent")}
              </span>
            )}
            {job.verified && (
              <span className="rounded-full bg-green/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green">
                {t("pages.jobs.card.verified")}
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>{t("pages.jobs.card.posted", { n: job.postedDays })}</span>
            <span>{t("pages.jobs.card.applied", { n: job.applied })}</span>
            <span>{t("pages.jobs.card.openings", { n: job.openings })}</span>
          </div>
        </div>
      </div>

      {job.status === "draft" && (
        <div className="rounded-xl border border-orange/30 bg-orange/5 px-4 py-3 text-sm text-ink">
          {t("pages.jobDetail.providerDraftBanner")}
        </div>
      )}

      <OverviewSection title={t("providerDashboard.postJob.review.basicInfo")}>
        <OverviewItem icon={UserPlus} label={t("providerDashboard.postJob.fields.role")} value={roleLabel} />
        <OverviewItem icon={Briefcase} label={t("providerDashboard.postJob.fields.jobTitle")} value={titleLabel} />
        <OverviewItem icon={Tag} label={t("providerDashboard.postJob.fields.openings")} value={fmt(job.openings)} />
        <OverviewItem
          icon={Calendar}
          label={t("providerDashboard.postJob.fields.deadline")}
          value={fmt(job.applicationDeadline)}
        />
        <OverviewItem icon={Clock} label={t("providerDashboard.postJob.fields.employment")} value={employmentLabel} />
        <OverviewItem
          icon={MapPin}
          label={t("providerDashboard.postJob.fields.searchAddr")}
          value={fmt(extra.searchAddr)}
          multiline
        />
        <OverviewItem icon={FileText} label={t("providerDashboard.postJob.fields.industry")} value={industryLabel} />
        <OverviewItem icon={MapPin} label={t("pages.jobDetail.pincode")} value={fmt(job.pincode)} />
        <OverviewItem icon={MapPin} label={t("pages.jobDetail.city")} value={fmt(job.city)} />
        <OverviewItem icon={MapPin} label={t("pages.jobDetail.state")} value={fmt(job.state)} />
        <OverviewItem
          icon={Phone}
          label={t("providerDashboard.postJob.fields.phone")}
          value={job.contactPhone ? `+91 ${job.contactPhone}` : notSpecified}
        />
        <OverviewItem icon={Mail} label={t("providerDashboard.postJob.fields.email")} value={fmt(job.contactEmail)} />
      </OverviewSection>

      <OverviewSection title={t("providerDashboard.postJob.review.jobDetails")}>
        <OverviewItem icon={IndianRupee} label={t("pages.jobDetail.salaryRange")} value={salaryLabel} />
        <OverviewItem icon={Clock} label={t("pages.jobDetail.workingHours")} value={hoursLabel} />
        <OverviewItem icon={MessageCircle} label={t("pages.jobDetail.availableShifts")} value={shiftsLabel} />
        <OverviewItem
          icon={FileText}
          label={t("pages.jobDetail.keyResponsibilities")}
          value={responsibilitiesText}
          multiline
          className="sm:col-span-2 lg:col-span-3"
        />
        <OverviewItem
          icon={FileText}
          label={t("pages.jobDetail.descriptionTitle")}
          value={fmt(job.description)}
          multiline
          className="sm:col-span-2 lg:col-span-3"
        />
        <OverviewItem
          icon={Tag}
          label={t("pages.jobDetail.benefits")}
          value={benefitsLabel}
          multiline
          className="sm:col-span-2"
        />
        <OverviewItem icon={UserPlus} label={t("providerDashboard.postJob.fields.joining")} value={joiningLabel} />
        <OverviewItem icon={MapPin} label={t("providerDashboard.postJob.fields.wfh")} value={fmt(job.workFromHome)} />
        <OverviewItem icon={Tag} label={t("providerDashboard.postJob.fields.urgent")} value={fmt(job.urgent)} />
        <OverviewItem icon={Medal} label={t("providerDashboard.postJob.fields.experience")} value={experienceLabel} />
        <OverviewItem icon={GraduationCap} label={t("pages.jobDetail.education")} value={educationLabel} />
        <OverviewItem
          icon={Medal}
          label={t("providerDashboard.postJob.fields.skills")}
          value={skillsLabel}
          multiline
          className="sm:col-span-2 lg:col-span-3"
        />
      </OverviewSection>

      <OverviewSection title={t("providerDashboard.postJob.review.screeningQuestions")}>
        <OverviewItem
          icon={MessageCircle}
          label={t("providerDashboard.postJob.steps.questions")}
          value={questionsLabel}
          multiline
          className="sm:col-span-2 lg:col-span-3"
        />
      </OverviewSection>

      <OverviewSection title={t("providerDashboard.postJob.review.publishSettings")}>
        <OverviewItem icon={Calendar} label={t("providerDashboard.postJob.publish.title")} value={publishLabel} />
        <OverviewItem
          icon={Save}
          label={t("providerDashboard.jobManagement.jobStatus", { defaultValue: "Job status" })}
          value={statusLabel}
        />
      </OverviewSection>

      <div className="flex justify-end">
        <Link
          href={editHref}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          {t("providerDashboard.jobManagement.edit")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function OverviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className="h-1 bg-orange" />
      <div className="border-b border-line bg-soft/30 px-5 py-4 sm:px-6">
        <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function OverviewItem({
  icon: Icon,
  label,
  value,
  multiline,
  className = "",
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  multiline?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 gap-3 ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink">{label}</p>
        <p
          className={`text-sm text-muted-foreground ${multiline ? "mt-0.5 whitespace-pre-wrap break-words" : "mt-0.5 truncate sm:whitespace-normal sm:break-words"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
