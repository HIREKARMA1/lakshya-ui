"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { resumeFileLabelFromUrl } from "@/lib/resume-file-label";
import { useAuth } from "@/hooks/useAuth";
import "@/lib/i18n";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type Props = {
  className?: string;
};

export function ResumeSection({ className }: Props) {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [viewing, setViewing] = useState(false);

  const resumeUrl = user?.seeker_profile?.resume_url;
  const busy = uploading || removing || viewing;

  const pickFile = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(t("dashboard.profile.resume.tooLarge"));
      return;
    }
    setUploading(true);
    try {
      await api.uploadSeekerResume(file);
      await refresh();
      toast.success(t("dashboard.profile.resume.uploaded"));
    } catch {
      toast.error(t("dashboard.profile.resume.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const viewResume = async () => {
    if (!resumeUrl || viewing) return;
    setViewing(true);
    try {
      const { view_url } = await api.getSeekerResumeViewUrl();
      if (view_url) {
        window.open(view_url, "_blank", "noopener,noreferrer");
        return;
      }
      const blob = await api.fetchSeekerResumeFile();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      toast.error(t("dashboard.profile.resume.viewFailed"));
    } finally {
      setViewing(false);
    }
  };

  const remove = async () => {
    if (!resumeUrl || busy) return;
    setRemoving(true);
    try {
      await api.deleteSeekerResume();
      await refresh();
      toast.success(t("dashboard.profile.resume.removed"));
    } catch {
      toast.error(t("dashboard.profile.resume.removeFailed"));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <section className={`rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6 ${className ?? ""}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{t("dashboard.profile.resume.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("dashboard.profile.resume.subtitle")}</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onFileChange} />

      {resumeUrl ? (
        <div className="flex flex-col gap-3 rounded-lg border border-line/80 bg-soft/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{resumeFileLabelFromUrl(resumeUrl)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("dashboard.profile.resume.onFile")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={viewResume}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-soft disabled:opacity-60"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              {viewing ? t("dashboard.profile.resume.opening") : t("dashboard.profile.resume.view")}
            </button>
            <button
              type="button"
              onClick={pickFile}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden />
              {uploading ? t("dashboard.profile.resume.uploading") : t("dashboard.profile.resume.replace")}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-red/30 bg-red/5 px-3 py-2 text-xs font-semibold text-red hover:bg-red/10 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              {removing ? t("dashboard.profile.resume.removing") : t("dashboard.profile.resume.remove")}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-soft/10 p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("dashboard.profile.resume.empty")}</p>
          <button
            type="button"
            onClick={pickFile}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" aria-hidden />
            {uploading ? t("dashboard.profile.resume.uploading") : t("dashboard.profile.resume.upload")}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">{t("dashboard.profile.resume.formats")}</p>
        </div>
      )}
    </section>
  );
}
