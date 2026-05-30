"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ImageIcon, Upload, X } from "lucide-react";
import type { ProviderProfile } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { compressProfilePhoto } from "@/lib/compress-profile-photo";
import { resolveUploadUrl } from "@/lib/profile-photo-url";
import { profileToProviderEditState, type ProviderEditState } from "@/lib/provider-profile-utils";
import { Field, inputCls } from "@/components/auth/registerShared";
import "@/lib/i18n";

const MAX_WORKPLACE_PHOTOS = 5;
const PROVIDER_TYPE_KEYS = ["enterprise", "individual"] as const;

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

type Props = {
  initialProfile: ProviderProfile | null;
  accountEmail?: string;
  onCancel: () => void;
  onSaved: () => void;
};

export function ProviderProfileEditForm({ initialProfile, accountEmail, onCancel, onSaved }: Props) {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();
  const [f, setF] = useState<ProviderEditState>(() =>
    profileToProviderEditState(initialProfile ?? user?.provider_profile, { accountEmail }),
  );
  const [existingWorkplace, setExistingWorkplace] = useState<string[]>(
    () => initialProfile?.workplace_photo_urls ?? user?.provider_profile?.workplace_photo_urls ?? [],
  );
  const [workplaceBusy, setWorkplaceBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const workplaceInputRef = useRef<HTMLInputElement>(null);

  const isEnterprise = f.providerType === "enterprise";
  const existingLogo = resolveUploadUrl(initialProfile?.logo_url ?? user?.provider_profile?.logo_url);
  const existingDoc = resolveUploadUrl(initialProfile?.doc_url ?? user?.provider_profile?.doc_url);

  const totalWorkplaceCount = existingWorkplace.length;
  const workplaceSlotsLeft = MAX_WORKPLACE_PHOTOS - totalWorkplaceCount;
  const profileBusy = saving || workplaceBusy;

  const set = <K extends keyof ProviderEditState>(k: K, v: ProviderEditState[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  const syncWorkplaceFromUser = (latestUser: { provider_profile?: ProviderProfile | null }) => {
    setExistingWorkplace(latestUser.provider_profile?.workplace_photo_urls ?? []);
  };

  const onWorkplacePick = async (list: FileList | null) => {
    if (!list?.length || workplaceSlotsLeft <= 0 || workplaceBusy) return;
    const picked = await Promise.all(
      Array.from(list)
        .slice(0, workplaceSlotsLeft)
        .map((file) => (file.type.startsWith("image/") ? compressProfilePhoto(file) : file)),
    );
    if (!picked.length) return;

    setWorkplaceBusy(true);
    try {
      const latestUser = await api.addProviderWorkplacePhotos(picked);
      localStorage.setItem("user", JSON.stringify(latestUser));
      syncWorkplaceFromUser(latestUser);
      await refresh();
      toast.success(t("providerDashboard.companyProfile.workplaceUploaded"));
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, t("providerDashboard.companyProfile.workplaceUploadFailed")));
    } finally {
      setWorkplaceBusy(false);
    }
  };

  const removeWorkplacePhoto = async (index: number) => {
    if (workplaceBusy) return;
    setWorkplaceBusy(true);
    try {
      const latestUser = await api.deleteProviderWorkplacePhoto(index);
      localStorage.setItem("user", JSON.stringify(latestUser));
      syncWorkplaceFromUser(latestUser);
      await refresh();
      toast.success(t("providerDashboard.companyProfile.workplaceRemoved"));
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, t("providerDashboard.companyProfile.workplaceRemoveFailed")));
    } finally {
      setWorkplaceBusy(false);
    }
  };

  const save = async () => {
    setErr(null);
    if (!f.fullName.trim()) return setErr(t("register.seeker.errors.nameRequired"));
    if (!f.city.trim()) return setErr(t("register.seeker.errors.cityRequired"));
    if (!f.phone.trim()) return setErr(t("register.provider.phoneRequired"));

    setSaving(true);
    try {
      const updated = await api.updateProviderProfile({
        provider_type: f.providerType,
        full_name: f.fullName.trim(),
        legal_name: isEnterprise ? f.legalName.trim() || undefined : undefined,
        incorporation: isEnterprise ? f.incorporation.trim() || undefined : undefined,
        search_addr: f.searchAddr.trim() || undefined,
        pincode: f.pincode.trim() || undefined,
        area: f.area.trim() || undefined,
        locality: f.locality.trim() || undefined,
        city: f.city.trim(),
        district: f.district.trim() || f.city.trim(),
        state: f.state.trim() || undefined,
        email: f.email.trim() || undefined,
        phone: f.phone.trim(),
        primary_mode: f.primaryMode,
      });
      localStorage.setItem("user", JSON.stringify(updated));

      if (f.logo) await api.uploadProviderLogo(f.logo);
      if (isEnterprise && f.doc) await api.uploadProviderDoc(f.doc);

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
        {t("dashboard.profile.editFlowHint")}
      </p>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("providerDashboard.companyProfile.sections.organization")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-ink">{t("register.provider.providerType")}</p>
            <div className="flex flex-wrap gap-3">
              {PROVIDER_TYPE_KEYS.map((key) => (
                <label key={key} className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="providerType"
                    checked={f.providerType === key}
                    onChange={() => set("providerType", key)}
                  />
                  <span className="text-sm font-medium">{t(`register.provider.types.${key}`)}</span>
                </label>
              ))}
            </div>
          </div>
          <Field label={t("register.provider.fullName")} required>
            <input value={f.fullName} onChange={(e) => set("fullName", e.target.value)} className={inputCls} />
          </Field>
          {isEnterprise && (
            <>
              <Field label={t("register.provider.legalName")}>
                <input value={f.legalName} onChange={(e) => set("legalName", e.target.value)} className={inputCls} />
              </Field>
              <Field label={t("register.provider.incorporationLabel")}>
                <input
                  value={f.incorporation}
                  onChange={(e) => set("incorporation", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("providerDashboard.companyProfile.sections.contact")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("providerDashboard.companyProfile.businessEmail")}>
            <input
              type="email"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={t("register.provider.phone")} required>
            <input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-ink">{t("register.provider.primaryModeLabel")}</p>
            <div className="flex flex-wrap gap-4">
              {(["email", "phone"] as const).map((mode) => (
                <label key={mode} className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="primaryMode"
                    checked={f.primaryMode === mode}
                    onChange={() => set("primaryMode", mode)}
                  />
                  <span className="text-sm font-medium">
                    {mode === "phone" ? t("register.provider.primaryPhone") : t("register.provider.primaryEmail")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("providerDashboard.companyProfile.sections.location")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label={t("register.provider.searchAddr")}>
              <input value={f.searchAddr} onChange={(e) => set("searchAddr", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label={t("register.provider.pincode")}>
            <input value={f.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputCls} />
          </Field>
          <Field label={t("register.provider.city")} required>
            <input value={f.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
          </Field>
          <Field label={t("register.provider.area")}>
            <input value={f.area} onChange={(e) => set("area", e.target.value)} className={inputCls} />
          </Field>
          <Field label={t("register.provider.locality")}>
            <input value={f.locality} onChange={(e) => set("locality", e.target.value)} className={inputCls} />
          </Field>
          <Field label={t("register.provider.district")}>
            <input value={f.district} onChange={(e) => set("district", e.target.value)} className={inputCls} />
          </Field>
          <Field label={t("register.provider.state")}>
            <input value={f.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("providerDashboard.companyProfile.sections.documents")}
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {isEnterprise && (
            <div>
              <p className="text-sm font-semibold text-ink">{t("register.provider.logo")}</p>
              {existingLogo && !f.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={existingLogo} alt="" className="mt-2 h-24 w-24 rounded-lg border object-cover" />
              )}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={saving}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold"
              >
                <Upload className="h-4 w-4" />
                {t("dashboard.profile.resume.chooseFile")}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => set("logo", e.target.files?.[0] ?? null)}
              />
              {f.logo && <p className="mt-1 text-xs text-muted-foreground">{f.logo.name}</p>}
            </div>
          )}
          {isEnterprise && (
            <div>
              <p className="text-sm font-semibold text-ink">{t("register.provider.document")}</p>
              {existingDoc && !f.doc && (
                <a href={existingDoc} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm text-primary">
                  {t("providerDashboard.companyProfile.viewDocument")}
                </a>
              )}
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={saving}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold"
              >
                <Upload className="h-4 w-4" />
                {t("dashboard.profile.resume.chooseFile")}
              </button>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => set("doc", e.target.files?.[0] ?? null)}
              />
              {f.doc && <p className="mt-1 text-xs text-muted-foreground">{f.doc.name}</p>}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("providerDashboard.companyProfile.sections.workplace")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("providerDashboard.companyProfile.workplacePhotosHint")}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {existingWorkplace.map((url, index) => {
            const src = resolveUploadUrl(url);
            return (
              <div key={`${url}-${index}`} className="relative aspect-video overflow-hidden rounded-lg border border-line">
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  title={t("providerDashboard.companyProfile.removePhoto")}
                  disabled={profileBusy}
                  onClick={() => void removeWorkplacePhoto(index)}
                  className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        {workplaceSlotsLeft > 0 && (
          <button
            type="button"
            onClick={() => workplaceInputRef.current?.click()}
            disabled={profileBusy}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-dashed border-line px-4 py-3 text-sm font-semibold text-ink hover:border-primary disabled:opacity-60"
          >
            <ImageIcon className="h-4 w-4 text-primary" />
            {workplaceBusy
              ? t("providerDashboard.companyProfile.workplaceUploading")
              : `${t("providerDashboard.companyProfile.uploadWorkplace")} (${totalWorkplaceCount}/${MAX_WORKPLACE_PHOTOS})`}
          </button>
        )}
        {workplaceSlotsLeft <= 0 && (
          <p className="mt-3 text-xs font-medium text-orange">{t("providerDashboard.companyProfile.maxWorkplacePhotos")}</p>
        )}
        <input
          ref={workplaceInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void onWorkplacePick(e.target.files);
            e.target.value = "";
          }}
        />
      </section>

      <div className="hidden flex-wrap gap-3 border-t border-line pt-6 lg:flex">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? t("dashboard.profile.saving") : t("dashboard.profile.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-soft disabled:opacity-60"
        >
          {t("dashboard.profile.cancel")}
        </button>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-20 flex gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 lg:hidden">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="min-h-12 min-w-0 flex-1 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? t("dashboard.profile.saving") : t("dashboard.profile.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="min-h-12 shrink-0 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-soft disabled:opacity-60"
        >
          {t("dashboard.profile.cancel")}
        </button>
      </div>
    </div>
  );
}
