import type { Job, JobExtra } from "@/types/job";

/** Parse `YYYY-MM-DDTHH:mm` stored from LakshyaDatePicker (local / IST). */
export function parseScheduledAt(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const text = value.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(text);
  if (!m) {
    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [, y, mo, d, h, mi] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
}

export function getJobScheduleInfo(job: Job) {
  const extra = (job.extra ?? {}) as JobExtra;
  const isScheduledDraft =
    (job.status ?? "").toLowerCase() === "draft" &&
    extra.publishMode === "scheduleLater" &&
    Boolean(extra.scheduledAt);
  const scheduledAt = parseScheduledAt(extra.scheduledAt);
  const now = new Date();
  const isDue = isScheduledDraft && scheduledAt !== null && scheduledAt.getTime() <= now.getTime();
  const isPending = isScheduledDraft && scheduledAt !== null && scheduledAt.getTime() > now.getTime();
  return { isScheduledDraft, scheduledAt, isDue, isPending };
}

export function formatScheduledAt(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}
