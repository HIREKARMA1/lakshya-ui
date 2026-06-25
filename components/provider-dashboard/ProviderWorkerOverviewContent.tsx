"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  MapPin,
  Radio,
  User,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { resolveProfilePhotoUrl } from "@/lib/profile-photo-url";
import { EDUCATION_KEYS, parseEducationLabels } from "@/lib/register-seeker-education";
import {
  EXPERIENCE_I18N,
  formatDobDisplay,
  parseWorkRoles,
} from "@/lib/seeker-profile-utils";
import { SectionLoader } from "@/components/ui/Spinner";
import type { SeekerWorkerProfile } from "@/types/worker-profile";
import "@/lib/i18n";

function fmt(raw: string | number | null | undefined, notSet: string): string {
  if (raw === null || raw === undefined) return notSet;
  const text = String(raw).trim();
  return text || notSet;
}

function formatExpires(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ProviderWorkerOverviewContent({ workerId }: { workerId: string }) {
  const { t } = useTranslation();
  const { data: worker, isLoading, isError } = useQuery({
    queryKey: ["provider-worker-profile", workerId],
    queryFn: () => api.getWorkerProfile(workerId),
    retry: false,
  });

  if (isLoading) {
    return <SectionLoader label={t("common.loading")} className="min-h-[40vh]" />;
  }

  if (isError || !worker) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display text-xl font-bold text-ink">{t("providerDashboard.workerProfile.notFound")}</p>
        <Link
          href="/provider-dashboard/available-workers"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("providerDashboard.nav.availableWorkers")}
        </Link>
      </div>
    );
  }

  return <ProviderWorkerOverviewView worker={worker} />;
}

function ProviderWorkerOverviewView({ worker }: { worker: SeekerWorkerProfile }) {
  const { t } = useTranslation();
  const notSet = t("dashboard.profile.notSet");
  const educationLabels = parseEducationLabels(t("register.seeker.education", { returnObjects: true }));
  const workRoles = parseWorkRoles(worker.primary_skill, worker.preferred_role);
  const photoSrc = resolveProfilePhotoUrl(worker.photo_url ?? undefined);
  const displayName = worker.full_name?.trim() || notSet;
  const initials = (displayName !== notSet ? displayName : "W").slice(0, 2).toUpperCase();
  const av = worker.availability;

  const educationLabel =
    worker.education_key && EDUCATION_KEYS.includes(worker.education_key as (typeof EDUCATION_KEYS)[number])
      ? educationLabels[worker.education_key as keyof typeof educationLabels]
      : fmt(worker.education_key, notSet);

  const expKey = worker.experience ?? "";
  const experienceLabel =
    expKey && EXPERIENCE_I18N[expKey] ? t(EXPERIENCE_I18N[expKey]) : fmt(worker.experience, notSet);

  const genderLabel = worker.gender
    ? t(`common.gender.${worker.gender}`, { defaultValue: worker.gender })
    : notSet;

  const locationLine = [worker.city, worker.district !== worker.city ? worker.district : null, worker.state]
    .filter(Boolean)
    .join(", ");

  const availabilityWindow = av.availability_window
    ? t(`workerAvailability.windows.${av.availability_window}`)
    : notSet;
  const shiftLabel = av.shift_preference
    ? t(`workerAvailability.shifts.${av.shift_preference}`)
    : notSet;
  const expiresLabel = formatExpires(av.expires_at) ?? notSet;
  const wageLabel =
    av.expected_daily_wage != null
      ? `₹${av.expected_daily_wage.toLocaleString("en-IN")}/${t("nearbyWorkers.perDay")}`
      : notSet;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <Link
        href="/provider-dashboard/available-workers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("providerDashboard.nav.availableWorkers")}
      </Link>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {photoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoSrc}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full border-4 border-white object-cover shadow-md"
              />
            ) : (
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-white bg-primary text-2xl font-bold text-white shadow-md">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{displayName}</h1>
              {locationLine && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {locationLine}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {av.is_live ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green">
                    <Radio className="h-3 w-3" />
                    {t("providerDashboard.workerProfile.liveNow")}
                  </span>
                ) : (
                  <span className="rounded-full bg-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("providerDashboard.workerProfile.offline")}
                  </span>
                )}
                {av.emergency_join && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-orange px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    <Zap className="h-3 w-3" />
                    {t("nearbyWorkers.emergency")}
                  </span>
                )}
                {worker.verified && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {t("providerDashboard.workerProfile.verified")}
                  </span>
                )}
              </div>
              {workRoles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {workRoles.map((key) => (
                    <span
                      key={key}
                      className="rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-xs font-semibold text-primary"
                    >
                      {t(`roles.${key}`, { defaultValue: key })}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <OverviewSection title={t("providerDashboard.workerProfile.sections.personal")}>
        <OverviewItem icon={User} label={t("register.seeker.fields.gender")} value={genderLabel} />
        <OverviewItem icon={Calendar} label={t("register.seeker.fields.dob")} value={formatDobDisplay(worker.dob) ?? notSet} />
        <OverviewItem
          icon={User}
          label={t("register.seeker.fields.age")}
          value={worker.age ? `${worker.age} ${t("dashboard.profile.years")}` : notSet}
        />
        <OverviewItem icon={GraduationCap} label={t("register.seeker.fields.education")} value={educationLabel} />
        <OverviewItem
          icon={FileText}
          label={t("providerDashboard.workerProfile.resume")}
          value={worker.has_resume ? t("providerDashboard.workerProfile.resumeOnFile") : notSet}
        />
      </OverviewSection>

      <OverviewSection title={t("providerDashboard.workerProfile.sections.location")}>
        <OverviewItem icon={MapPin} label={t("register.seeker.fields.pincode")} value={fmt(worker.pincode, notSet)} />
        <OverviewItem icon={MapPin} label={t("register.seeker.fields.state")} value={fmt(worker.state, notSet)} />
        <OverviewItem icon={MapPin} label={t("register.seeker.fields.city")} value={fmt(worker.city, notSet)} />
        <OverviewItem icon={MapPin} label={t("register.seeker.fields.district")} value={fmt(worker.district, notSet)} />
        <OverviewItem
          icon={MapPin}
          label={t("dashboard.profile.exactLocation")}
          value={fmt(worker.exact_location, notSet)}
          multiline
          className="sm:col-span-2 lg:col-span-3"
        />
      </OverviewSection>

      <OverviewSection title={t("providerDashboard.workerProfile.sections.work")}>
        <OverviewItem icon={Briefcase} label={t("register.seeker.fields.experience")} value={experienceLabel} />
        <OverviewItem
          icon={Briefcase}
          label={t("register.seeker.fields.primarySkill")}
          value={
            workRoles.length > 0
              ? workRoles.map((k) => t(`roles.${k}`, { defaultValue: k })).join(", ")
              : notSet
          }
          multiline
        />
        <OverviewItem
          icon={Briefcase}
          label={t("providerDashboard.workerProfile.expYears")}
          value={String(worker.exp_years ?? 0)}
        />
      </OverviewSection>

      <OverviewSection title={t("providerDashboard.workerProfile.sections.availability")}>
        <OverviewItem
          icon={Radio}
          label={t("providerDashboard.workerProfile.status")}
          value={av.is_live ? t("providerDashboard.workerProfile.liveNow") : t("providerDashboard.workerProfile.offline")}
        />
        <OverviewItem icon={Calendar} label={t("workerAvailability.whenAvailable")} value={availabilityWindow} />
        <OverviewItem icon={Clock} label={t("workerAvailability.shift")} value={shiftLabel} />
        <OverviewItem icon={Clock} label={t("workerAvailability.joinWithin")} value={av.join_within_hours != null ? t("nearbyWorkers.joinWithin", { hours: av.join_within_hours }) : notSet} />
        <OverviewItem icon={MapPin} label={t("workerAvailability.maxTravel")} value={av.max_travel_km != null ? t("workerAvailability.summaryTravel", { km: av.max_travel_km }) : notSet} />
        <OverviewItem icon={Briefcase} label={t("workerAvailability.dailyWage")} value={wageLabel} />
        <OverviewItem
          icon={Zap}
          label={t("workerAvailability.emergency")}
          value={av.emergency_join ? t("common.yes") : t("common.no")}
        />
        <OverviewItem icon={MapPin} label={t("workerAvailability.location")} value={fmt(av.location_label, notSet)} />
        <OverviewItem icon={Clock} label={t("workerAvailability.expires")} value={expiresLabel} />
      </OverviewSection>
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
