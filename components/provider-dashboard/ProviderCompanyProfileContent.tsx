"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  FileText,
  ImageIcon,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resolveUploadUrl } from "@/lib/profile-photo-url";
import { emailsMatch } from "@/lib/provider-profile-utils";
import type { ProviderProfile } from "@/types/auth";
import { ProviderProfileEditForm } from "@/components/provider-dashboard/ProviderProfileEditForm";
import { WorkplacePhotoGallery } from "@/components/shared/WorkplacePhotoGallery";
import "@/lib/i18n";

function InfoItem({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  const display = value?.trim();
  return (
    <div className="rounded-lg border border-line/80 bg-soft/20 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children ?? <p className="mt-1 text-sm font-semibold text-ink">{display || "—"}</p>}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function providerTypeLabel(t: (key: string, opts?: { defaultValue?: string }) => string, type?: string | null) {
  if (!type) return "—";
  const key = `register.provider.types.${type}`;
  const translated = t(key, { defaultValue: "" });
  if (translated && translated !== key) return translated;
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
}

function primaryModeLabel(t: (key: string) => string, mode?: string | null) {
  if (mode === "phone") return t("register.provider.primaryPhone");
  if (mode === "email") return t("register.provider.primaryEmail");
  return mode || "—";
}

function formatLocation(p: ProviderProfile | null | undefined, notSet: string) {
  const parts = [
    p?.search_addr,
    p?.locality,
    p?.area,
    p?.city,
    p?.district && p.district !== p?.city ? p.district : null,
    p?.state,
    p?.pincode ? `PIN ${p.pincode}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : notSet;
}

export function ProviderCompanyProfileContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editFormKey, setEditFormKey] = useState(0);

  const p = user?.provider_profile;
  const notSet = t("dashboard.profile.notSet");
  const isEnterprise = p?.provider_type === "enterprise";
  const displayName =
    p?.full_name?.trim() || p?.legal_name?.trim() || user?.name || user?.email || notSet;
  const initials = (displayName !== notSet ? displayName : user?.email ?? "P").slice(0, 2).toUpperCase();
  const logoSrc = resolveUploadUrl(p?.logo_url);
  const docSrc = resolveUploadUrl(p?.doc_url);
  const locationSummary = formatLocation(p, notSet);
  const workplaceUrls = (p?.workplace_photo_urls ?? []).map((u) => resolveUploadUrl(u)).filter(Boolean) as string[];
  const showBusinessEmail = Boolean(p?.email?.trim() && !emailsMatch(p.email, user?.email));

  const startEdit = () => {
    setEditFormKey((k) => k + 1);
    setEditing(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">
            {t("providerDashboard.companyProfile.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("providerDashboard.companyProfile.subtitle")}</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="hidden shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 lg:inline-flex"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {t("dashboard.profile.edit")}
          </button>
        )}
      </div>

      {!user?.profile_complete && !editing && (
        <div className="rounded-xl border border-orange/30 bg-orange/5 p-4 sm:p-5">
          <p className="text-sm text-ink">{t("providerDashboard.companyProfile.incomplete")}</p>
          <Link
            href="/register/provider"
            className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            {t("dashboard.profile.completeCta")}
          </Link>
        </div>
      )}

      {editing ? (
        <ProviderProfileEditForm
          key={editFormKey}
          initialProfile={p ?? null}
          accountEmail={user?.email}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-xl border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <span className="grid h-24 w-24 shrink-0 place-items-center rounded-xl border-4 border-white bg-primary text-3xl font-bold text-white shadow-md">
                    {initials}
                  </span>
                )}
                <div className="text-center sm:text-left">
                  <p className="font-display text-2xl font-extrabold text-ink">{displayName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                      {providerTypeLabel(t, p?.provider_type)}
                    </span>
                    {user?.profile_complete && (
                      <span className="inline-flex rounded-full bg-green/10 px-3 py-0.5 text-xs font-semibold text-green">
                        {t("dashboard.profile.completeBadge")}
                      </span>
                    )}
                    {p?.verified && (
                      <span className="inline-flex rounded-full bg-green/10 px-3 py-0.5 text-xs font-semibold text-green">
                        {t("register.provider.verified", { defaultValue: "Verified" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section icon={Building2} title={t("providerDashboard.companyProfile.sections.organization")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem
                  label={t("register.provider.providerType")}
                  value={providerTypeLabel(t, p?.provider_type)}
                />
                <InfoItem label={t("register.provider.fullName")} value={p?.full_name} />
                {isEnterprise && (
                  <>
                    <InfoItem
                      label={t("providerDashboard.companyProfile.businessName")}
                      value={p?.legal_name}
                    />
                    <InfoItem label={t("register.provider.incorporationLabel")} value={p?.incorporation} />
                  </>
                )}
              </div>
            </Section>

            <Section icon={Phone} title={t("providerDashboard.companyProfile.sections.contact")}>
              <div className="grid gap-3 sm:grid-cols-2">
                {showBusinessEmail && (
                  <InfoItem label={t("providerDashboard.companyProfile.businessEmail")} value={p?.email} />
                )}
                <InfoItem label={t("register.provider.phone")} value={p?.phone} />
                <InfoItem
                  label={t("register.provider.primaryModeLabel")}
                  value={primaryModeLabel(t, p?.primary_mode)}
                />
              </div>
            </Section>
          </div>

          <Section icon={MapPin} title={t("providerDashboard.companyProfile.sections.location")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <InfoItem label={t("register.provider.searchAddr")} value={p?.search_addr} />
              </div>
              <InfoItem label={t("register.provider.pincode")} value={p?.pincode} />
              <InfoItem label={t("register.provider.area")} value={p?.area} />
              <InfoItem label={t("register.provider.locality")} value={p?.locality} />
              <InfoItem label={t("register.provider.city")} value={p?.city} />
              <InfoItem label={t("register.provider.district")} value={p?.district} />
              <InfoItem label={t("register.provider.state")} value={p?.state} />
              <div className="sm:col-span-2">
                <InfoItem label={t("dashboard.profile.location")} value={locationSummary} />
              </div>
            </div>
          </Section>

          {workplaceUrls.length > 0 && (
            <Section icon={ImageIcon} title={t("providerDashboard.companyProfile.sections.workplace")}>
              <p className="mb-4 text-xs text-muted-foreground">
                {t("providerDashboard.companyProfile.workplacePhotosHint")}
              </p>
              <WorkplacePhotoGallery
                urls={workplaceUrls}
                gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
              />
            </Section>
          )}

          {workplaceUrls.length === 0 && (
            <Section icon={ImageIcon} title={t("providerDashboard.companyProfile.sections.workplace")}>
              <p className="text-sm text-muted-foreground">{t("providerDashboard.companyProfile.workplaceEmpty")}</p>
            </Section>
          )}

          {isEnterprise && (
            <Section icon={FileText} title={t("providerDashboard.companyProfile.sections.documents")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem label={t("register.provider.logo")}>
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoSrc} alt="" className="mt-2 h-28 w-28 rounded-lg border border-line object-cover" />
                  ) : (
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <ImageIcon className="h-4 w-4" aria-hidden />
                      {notSet}
                    </p>
                  )}
                </InfoItem>
                <InfoItem label={t("register.provider.document")}>
                  {docSrc ? (
                    <a
                      href={docSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" aria-hidden />
                      {t("providerDashboard.companyProfile.viewDocument")}
                    </a>
                  ) : (
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <FileText className="h-4 w-4" aria-hidden />
                      {notSet}
                    </p>
                  )}
                </InfoItem>
              </div>
            </Section>
          )}
        </>
      )}

      {!editing && (
        <button
          type="button"
          onClick={startEdit}
          aria-label={t("dashboard.profile.edit")}
          title={t("dashboard.profile.edit")}
          className="fixed right-4 top-[calc(3.5rem+0.75rem)] z-30 grid h-12 w-12 place-items-center rounded-full bg-primary text-white shadow-lg ring-1 ring-black/10 transition hover:bg-primary/90 active:scale-[0.98] lg:hidden"
        >
          <Pencil className="h-5 w-5 shrink-0" aria-hidden />
        </button>
      )}
    </div>
  );
}
