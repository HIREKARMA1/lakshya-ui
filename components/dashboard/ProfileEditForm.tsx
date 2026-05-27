"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ExternalLink, FileText, Upload } from "lucide-react";
import type { SeekerProfile } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { resumeFileLabelFromUrl } from "@/lib/resume-file-label";
import { resolveProfilePhotoUrl } from "@/lib/profile-photo-url";
import { ProfilePhotoField } from "@/components/auth/ProfilePhotoField";
import { DobPicker } from "@/components/auth/DobPicker";
import { WorkRolesMultiSelect } from "@/components/auth/WorkRolesMultiSelect";
import { Field, inputCls } from "@/components/auth/registerShared";
import { EDUCATION_KEYS, parseEducationLabels } from "@/lib/register-seeker-education";
import {
  profileToEditState,
  serializeWorkRoles,
  type ProfileEditState,
} from "@/lib/seeker-profile-utils";
import "@/lib/i18n";

const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const RESUME_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type Props = {
  /** Snapshot from parent when opening edit — ensures fields match what the user already sees on the profile page. */
  initialProfile: SeekerProfile | null;
  nameFallback?: string;
  onCancel: () => void;
  onSaved: () => void;
};

export function ProfileEditForm({ initialProfile, nameFallback, onCancel, onSaved }: Props) {
  const { t, i18n, ready } = useTranslation();
  const { user, refresh } = useAuth();
  const [f, setF] = useState<ProfileEditState>(() =>
    profileToEditState(initialProfile ?? user?.seeker_profile, { nameFallback }),
  );
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [openingResume, setOpeningResume] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const existingPhotoUrl = resolveProfilePhotoUrl(
    initialProfile?.photo_url ?? user?.seeker_profile?.photo_url ?? undefined,
  );
  const existingResumeUrl =
    initialProfile?.resume_url ?? user?.seeker_profile?.resume_url ?? null;

  const educationLabels = useMemo(
    () => parseEducationLabels(t("register.seeker.education", { returnObjects: true })),
    [t, ready, i18n.language, i18n.resolvedLanguage],
  );

  const set = <K extends keyof ProfileEditState>(k: K, v: ProfileEditState[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!f.dob) {
      if (f.age !== "") set("age", "");
      return;
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f.dob);
    if (!m) {
      if (f.age !== "") set("age", "");
      return;
    }
    const birthDate = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age -= 1;
    if (!Number.isFinite(age) || age < 0) age = 0;
    set("age", String(age));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.dob]);

  const onResumePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (file.size > RESUME_MAX_BYTES) {
      toast.error(
        t("dashboard.profile.resume.tooLarge", { defaultValue: "Resume must be 5 MB or smaller" }),
      );
      return;
    }
    setResumeFile(file);
  };

  const openExistingResume = async () => {
    if (!existingResumeUrl || openingResume || saving) return;
    setOpeningResume(true);
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
      toast.error(
        t("dashboard.profile.resume.viewFailed", { defaultValue: "Could not open resume" }),
      );
    } finally {
      setOpeningResume(false);
    }
  };

  const save = async () => {
    setErr(null);
    if (!f.fullName.trim()) return setErr(t("register.seeker.errors.nameRequired"));
    if (!f.pincode.trim()) return setErr(t("register.seeker.errors.pincodeRequired"));
    if (!f.city.trim()) return setErr(t("register.seeker.errors.cityRequired"));
    if (!f.state.trim()) return setErr(t("register.seeker.errors.stateRequired"));
    if (!f.education) return setErr(t("register.seeker.errors.educationRequired"));
    if (f.workRoles.length === 0) return setErr(t("register.seeker.errors.workRolesRequired"));

    const rolesCsv = serializeWorkRoles(f.workRoles);
    setSaving(true);
    try {
      if (f.photo) await api.uploadSeekerProfilePhoto(f.photo);
      const updated = await api.updateSeekerProfile({
        full_name: f.fullName.trim(),
        dob: f.dob,
        age: f.age,
        gender: f.gender,
        education_key: f.education,
        primary_skill: rolesCsv,
        preferred_role: rolesCsv,
        experience: f.experience,
        pincode: f.pincode.trim(),
        city: f.city.trim(),
        district: f.district.trim() || f.city.trim(),
        state: f.state.trim(),
      });
      localStorage.setItem("user", JSON.stringify(updated));
      if (resumeFile) await api.uploadSeekerResume(resumeFile);
      await refresh();
      toast.success(t("toast.profileSaved"));
      onSaved();
    } catch {
      toast.error(t("toast.profileSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-36 lg:pb-0">
      {err && (
        <div className="flex items-center gap-2 rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-sm font-medium text-red">
          {err}
        </div>
      )}

      <p className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-xs leading-relaxed text-ink lg:hidden">
        {t("dashboard.profile.editFlowHint", {
          defaultValue: "Update any section below, then tap Save changes when you are done.",
        })}
      </p>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">{t("dashboard.profile.sections.personal")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ProfilePhotoField
              file={f.photo}
              onChange={(photo) => set("photo", photo)}
              existingPhotoUrl={existingPhotoUrl}
            />
          </div>
          <Field label={t("register.seeker.fields.fullName")} required>
            <input
              value={f.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder={t("register.seeker.fields.fullNamePh")}
              className={inputCls}
            />
          </Field>
          <Field label={t("register.seeker.fields.dob")} required>
            <DobPicker value={f.dob} onChange={(v) => set("dob", v)} />
          </Field>
          <Field label={t("register.seeker.fields.age")}>
            <input value={f.age} readOnly className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-ink">
              {t("register.seeker.fields.gender")} <span className="text-red">*</span>
            </p>
            <div className="flex flex-wrap gap-4">
              {(["male", "female", "other"] as const).map((g) => (
                <label key={g} className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    checked={f.gender === g}
                    onChange={() => set("gender", g)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm text-ink">{t(`common.gender.${g}`)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">{t("dashboard.profile.sections.location")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("register.seeker.fields.pincode")} required>
            <input
              value={f.pincode}
              onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={inputCls}
            />
          </Field>
          <Field label={t("register.seeker.fields.state")} required>
            <input value={f.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("register.seeker.fields.city")} required>
              <input
                value={f.city}
                onChange={(e) => {
                  const v = e.target.value;
                  set("city", v);
                  set("district", v);
                }}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label={t("register.seeker.fields.education")} required>
            <select value={f.education} onChange={(e) => set("education", e.target.value)} className={inputCls}>
              <option value="">{educationLabels.selectPlaceholder}</option>
              {EDUCATION_KEYS.map((key) => (
                <option key={key} value={key}>
                  {educationLabels[key]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">{t("dashboard.profile.sections.work")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("register.seeker.fields.experience")} required>
            <select value={f.experience} onChange={(e) => set("experience", e.target.value)} className={inputCls}>
              <option value="fresher">{t("register.seeker.experience.fresher")}</option>
              <option value="1-2">{t("register.seeker.experience.exp12")}</option>
              <option value="3-5">{t("register.seeker.experience.exp35")}</option>
              <option value="5+">{t("register.seeker.experience.exp5plus")}</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("register.seeker.fields.primarySkill")} required>
              <WorkRolesMultiSelect value={f.workRoles} onChange={(workRoles) => set("workRoles", workRoles)} />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="font-display text-lg font-bold text-ink">
            {t("dashboard.profile.resume.title", { defaultValue: "Resume" })}
          </h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {t("dashboard.profile.resume.saveHint", {
            defaultValue: "Select a file here; it uploads when you tap Save changes.",
          })}
        </p>
        <input ref={resumeInputRef} type="file" accept={RESUME_ACCEPT} className="hidden" onChange={onResumePick} />
        <div className="rounded-lg border border-dashed border-line bg-soft/10 p-5">
          {resumeFile ? (
            <div>
              {existingResumeUrl && (
                <div className="mb-4 flex flex-col gap-2 rounded-lg border border-line/80 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("dashboard.profile.resume.currentOnFile", { defaultValue: "Current file" })}
                    </p>
                    <p className="truncate text-sm font-semibold text-ink">
                      {resumeFileLabelFromUrl(existingResumeUrl)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openExistingResume}
                    disabled={saving || openingResume}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-soft disabled:opacity-60"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    {openingResume
                      ? t("dashboard.profile.resume.opening", { defaultValue: "Opening…" })
                      : t("dashboard.profile.resume.view", { defaultValue: "View" })}
                  </button>
                </div>
              )}
              <p className="text-sm font-semibold text-ink">
                {t("dashboard.profile.resume.pendingFile", { defaultValue: "Selected" })}: {resumeFile.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={saving}
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {t("dashboard.profile.resume.chooseDifferent", { defaultValue: "Choose a different file" })}
                </button>
                <button
                  type="button"
                  onClick={() => setResumeFile(null)}
                  disabled={saving}
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {t("common.clear")}
                </button>
              </div>
            </div>
          ) : (
            <>
              {existingResumeUrl && (
                <div className="mb-4 flex flex-col gap-3 rounded-lg border border-line/80 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {resumeFileLabelFromUrl(existingResumeUrl)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("dashboard.profile.resume.onFile", {
                        defaultValue: "Ready for employers to view",
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openExistingResume}
                    disabled={saving || openingResume}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-soft disabled:opacity-60"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    {openingResume
                      ? t("dashboard.profile.resume.opening", { defaultValue: "Opening…" })
                      : t("dashboard.profile.resume.view", { defaultValue: "View" })}
                  </button>
                </div>
              )}
              {existingResumeUrl && (
                <p className="mb-3 text-sm text-muted-foreground">
                  {t("dashboard.profile.resume.hasOnFileEdit", {
                    defaultValue:
                      "You already have a resume on file. Choose a new file to replace it when you save.",
                  })}
                </p>
              )}
              <button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" aria-hidden />
                {t("dashboard.profile.resume.chooseFile", { defaultValue: "Choose file" })}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("dashboard.profile.resume.formats", {
                  defaultValue: "PDF, DOC, or DOCX · Max 5 MB",
                })}
              </p>
            </>
          )}
        </div>
      </section>

      <div className="hidden flex-wrap gap-3 border-t border-line pt-6 lg:flex">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? t("dashboard.profile.saving") : t("dashboard.profile.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-soft disabled:opacity-60"
        >
          {t("dashboard.profile.cancel")}
        </button>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-20 flex gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 lg:hidden">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="min-h-12 min-w-0 flex-1 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? t("dashboard.profile.saving") : t("dashboard.profile.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="min-h-12 shrink-0 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:bg-soft disabled:opacity-60"
        >
          {t("dashboard.profile.cancel")}
        </button>
      </div>
    </div>
  );
}
