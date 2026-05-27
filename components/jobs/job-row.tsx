"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  Bookmark,
  MapPin,
  IndianRupee,
  Clock,
  Award,
  ArrowRight,
} from "lucide-react";
import type { Job } from "@/types/job";
import { api } from "@/lib/api";
import "@/lib/i18n";

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

function MetaField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
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

export function JobRow({
  job,
  applied: appliedProp = false,
  bookmarked: bookmarkedProp = false,
  seekerMode = false,
  onRequireLogin,
  onStatusChange,
}: {
  job: Job;
  applied?: boolean;
  bookmarked?: boolean;
  seekerMode?: boolean;
  onRequireLogin?: (jobId: string) => void;
  onStatusChange?: () => void;
}) {
  const { t } = useTranslation();
  const RoleIcon = ROLE_ICONS[job.roleKey] ?? Briefcase;
  const [applied, setApplied] = useState(appliedProp);
  const [isSaved, setIsSaved] = useState(bookmarkedProp);
  const [saveBusy, setSaveBusy] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);

  const hasApplied = applied || appliedProp;
  const hasSaved = isSaved || bookmarkedProp;

  const handleApply = async () => {
    if (hasApplied) return;
    if (!seekerMode) {
      onRequireLogin?.(job.id);
      return;
    }
    setApplyBusy(true);
    try {
      await api.applyToJob(job.id);
      setApplied(true);
      toast.success(t("pages.jobDetail.applySuccess"));
      onStatusChange?.();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      if (typeof msg === "string" && msg.toLowerCase().includes("already")) {
        setApplied(true);
        onStatusChange?.();
      } else {
        toast.error(typeof msg === "string" ? msg : t("pages.jobDetail.applyFailed"));
      }
    } finally {
      setApplyBusy(false);
    }
  };

  const toggleSave = async () => {
    if (!seekerMode) {
      onRequireLogin?.(job.id);
      return;
    }
    setSaveBusy(true);
    try {
      if (hasSaved) {
        await api.unbookmarkJob(job.id);
        setIsSaved(false);
        toast.success(t("dashboard.saved.remove"));
      } else {
        await api.bookmarkJob(job.id);
        setIsSaved(true);
        toast.success(t("pages.jobs.bookmark"));
      }
      onStatusChange?.();
    } catch {
      toast.error(t("toast.otpFailed"));
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <li className="group relative rounded-xl border border-line bg-white transition hover:border-primary/40 hover:shadow-lg">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <RoleIcon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-extrabold leading-tight text-ink sm:text-xl">
              {t(`roles.${job.roleKey}`)}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{job.company}</p>
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
            </div>
          </div>

          <button
            type="button"
            disabled={saveBusy}
            onClick={toggleSave}
            aria-label={t("pages.jobs.bookmark")}
            className={`shrink-0 rounded-md border p-2 transition ${
              hasSaved
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${hasSaved ? "fill-current" : ""}`} />
          </button>
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
        </div>
        <div className="flex gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-md border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
          >
            {t("pages.jobs.card.view")}
          </Link>
          <button
            type="button"
            onClick={handleApply}
            disabled={applyBusy || (seekerMode && hasApplied)}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white transition ${
              seekerMode && hasApplied
                ? "cursor-default bg-green hover:bg-green"
                : "bg-primary hover:bg-primary/90 disabled:opacity-70"
            }`}
          >
            {applyBusy
              ? t("pages.jobDetail.applying")
              : seekerMode && hasApplied
                ? t("pages.jobDetail.applied")
                : t("pages.jobs.card.apply")}
            {!hasApplied && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </li>
  );
}
