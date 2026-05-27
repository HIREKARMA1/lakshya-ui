"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MapPin, IndianRupee, Clock, Bookmark } from "lucide-react";
import type { Job } from "@/types/job";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useState } from "react";

const ROLE_ICONS: Record<string, string> = {
  delivery: "🛵",
  driver: "🚗",
  electrician: "⚡",
  cook: "👨‍🍳",
  security: "🛡️",
  cleaner: "✨",
  dataEntry: "⌨️",
  welder: "🔧",
};

export function DashboardJobCard({
  job,
  applied: appliedProp = false,
  bookmarked: bookmarkedProp = false,
  onStatusChange,
  onUnsave,
}: {
  job: Job;
  applied?: boolean;
  bookmarked?: boolean;
  onUnsave?: () => void;
  onStatusChange?: () => void;
}) {
  const { t } = useTranslation();
  const [applied, setApplied] = useState(appliedProp);
  const [isSaved, setIsSaved] = useState(bookmarkedProp);
  const [saveBusy, setSaveBusy] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);

  const hasApplied = applied || appliedProp;
  const hasSaved = isSaved || bookmarkedProp;

  const handleApply = async () => {
    if (hasApplied) return;
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

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaveBusy(true);
    try {
      if (hasSaved) {
        await api.unbookmarkJob(job.id);
        setIsSaved(false);
        onUnsave?.();
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
    <article className="rounded-xl border border-line bg-white p-4 shadow-sm transition hover:border-primary/30 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-xl">
            {ROLE_ICONS[job.roleKey] ?? "💼"}
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-ink sm:text-lg">{t(`roles.${job.roleKey}`)}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{job.company}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {job.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5 text-primary" />
                ₹{job.salaryMin.toLocaleString("en-IN")}–{job.salaryMax.toLocaleString("en-IN")}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> {t(`pages.jobs.type.${job.type}`)}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={saveBusy}
          onClick={toggleSave}
          aria-label={t("pages.jobs.bookmark")}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
            hasSaved
              ? "border-primary bg-primary/10 text-primary"
              : "border-line text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          <Bookmark className={`h-4 w-4 ${hasSaved ? "fill-current" : ""}`} />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {job.verified && (
          <span className="rounded-md bg-green/10 px-2 py-0.5 text-[10px] font-bold uppercase text-green">
            {t("pages.jobs.card.verified")}
          </span>
        )}
        {job.urgent && (
          <span className="rounded-md bg-orange/15 px-2 py-0.5 text-[10px] font-bold uppercase text-orange">
            {t("pages.jobs.card.urgent")}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{t("pages.jobs.card.posted", { n: job.postedDays })}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-md border border-line bg-white py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
        >
          {t("pages.jobs.card.view")}
        </Link>
        <button
          type="button"
          onClick={handleApply}
          disabled={applyBusy || hasApplied}
          className={`inline-flex flex-1 items-center justify-center rounded-md py-2 text-sm font-semibold text-white transition ${
            hasApplied ? "cursor-default bg-green hover:bg-green" : "bg-primary hover:bg-primary/90 disabled:opacity-70"
          }`}
        >
          {applyBusy
            ? t("pages.jobDetail.applying")
            : hasApplied
              ? t("pages.jobDetail.applied")
              : t("pages.jobs.card.apply")}
        </button>
      </div>
    </article>
  );
}
