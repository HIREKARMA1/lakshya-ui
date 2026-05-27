"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Briefcase, MapPin, Pencil, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resolveProfilePhotoUrl } from "@/lib/profile-photo-url";
import { EDUCATION_KEYS, parseEducationLabels } from "@/lib/register-seeker-education";
import {
  EXPERIENCE_I18N,
  formatDobDisplay,
  parseWorkRoles,
} from "@/lib/seeker-profile-utils";
import { ProfileEditForm } from "@/components/dashboard/ProfileEditForm";
import { ResumeSection } from "@/components/dashboard/ResumeSection";
import "@/lib/i18n";

function RoleChips({ roles }: { roles: string[] }) {
  const { t } = useTranslation();
  if (!roles.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {roles.map((key) => (
        <span
          key={key}
          className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
        >
          {t(`roles.${key}`, { defaultValue: key })}
        </span>
      ))}
    </div>
  );
}

function InfoItem({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line/80 bg-soft/20 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children ?? <p className="mt-1 text-sm font-semibold text-ink">{value}</p>}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
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

export function ProfileContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  /** Bump when opening edit so ProfileEditForm remounts with latest seeker_profile (avoids empty stale state). */
  const [editFormKey, setEditFormKey] = useState(0);
  const p = user?.seeker_profile;
  const notSet = t("dashboard.profile.notSet");

  const educationLabels = parseEducationLabels(
    t("register.seeker.education", { returnObjects: true }),
  );
  const educationLabel =
    p?.education_key && EDUCATION_KEYS.includes(p.education_key as (typeof EDUCATION_KEYS)[number])
      ? educationLabels[p.education_key as keyof typeof educationLabels]
      : p?.education_key || notSet;

  const locationParts = [p?.city, p?.district !== p?.city ? p?.district : null, p?.state].filter(Boolean);
  const location = locationParts.join(", ") || notSet;
  const photoSrc = resolveProfilePhotoUrl(p?.photo_url);
  const displayName = p?.full_name || user?.name || notSet;
  const initials = (displayName !== notSet ? displayName : user?.email ?? "U").slice(0, 2).toUpperCase();
  const workRoles = parseWorkRoles(p?.primary_skill, p?.preferred_role);
  const expKey = p?.experience ?? "";
  const experienceLabel = expKey && EXPERIENCE_I18N[expKey] ? t(EXPERIENCE_I18N[expKey]) : p?.experience || notSet;
  const dobDisplay = formatDobDisplay(p?.dob) ?? notSet;
  const genderLabel = p?.gender ? t(`common.gender.${p.gender}`, { defaultValue: p.gender }) : notSet;
  const hasResume = Boolean(p?.resume_url);
  const isFullyComplete = Boolean(user?.profile_complete && hasResume);

  const startEdit = () => {
    setEditFormKey((k) => k + 1);
    setEditing(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">{t("dashboard.profile.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.profile.subtitle")}</p>
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
          <p className="text-sm text-ink">{t("dashboard.profile.incomplete")}</p>
          <Link
            href="/register/seeker"
            className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            {t("dashboard.profile.completeCta")}
          </Link>
        </div>
      )}

      {editing ? (
        <ProfileEditForm
          key={editFormKey}
          initialProfile={p ?? null}
          nameFallback={user?.name}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                {photoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoSrc}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <span className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-white bg-primary text-3xl font-bold text-white shadow-md">
                    {initials}
                  </span>
                )}
                <div className="text-center sm:text-left">
                  <p className="font-display text-2xl font-extrabold text-ink">{displayName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
                  {isFullyComplete && (
                    <span className="mt-2 inline-flex rounded-full bg-green/10 px-3 py-0.5 text-xs font-semibold text-green">
                      {t("dashboard.profile.completeBadge")}
                    </span>
                  )}
                  {user?.profile_complete && !hasResume && (
                    <span className="mt-2 inline-flex rounded-full bg-orange/10 px-3 py-0.5 text-xs font-semibold text-orange">
                      {t("dashboard.profile.resumePendingBadge")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section icon={User} title={t("dashboard.profile.sections.personal")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem label={t("register.seeker.fields.fullName")} value={displayName} />
                <InfoItem label={t("register.seeker.fields.dob")} value={dobDisplay} />
                <InfoItem
                  label={t("register.seeker.fields.age")}
                  value={p?.age ? `${p.age} ${t("dashboard.profile.years")}` : notSet}
                />
                <InfoItem label={t("register.seeker.fields.gender")} value={genderLabel} />
                <InfoItem label={t("dashboard.profile.email")} value={user?.email ?? notSet} />
              </div>
            </Section>

            <Section icon={MapPin} title={t("dashboard.profile.sections.location")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem label={t("register.seeker.fields.pincode")} value={p?.pincode || notSet} />
                <InfoItem label={t("register.seeker.fields.state")} value={p?.state || notSet} />
                <div className="sm:col-span-2">
                  <InfoItem label={t("dashboard.profile.location")} value={location} />
                </div>
                <InfoItem label={t("register.seeker.fields.education")} value={educationLabel} />
              </div>
            </Section>
          </div>

          <Section icon={Briefcase} title={t("dashboard.profile.sections.work")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem label={t("register.seeker.fields.experience")} value={experienceLabel} />
              <div className="sm:col-span-2">
                <InfoItem label={t("register.seeker.fields.primarySkill")} value={undefined}>
                  {workRoles.length > 0 ? <RoleChips roles={workRoles} /> : <p className="mt-1 text-sm font-semibold text-ink">{notSet}</p>}
                </InfoItem>
              </div>
            </div>
          </Section>

          <ResumeSection />
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
