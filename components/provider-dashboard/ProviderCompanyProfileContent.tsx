"use client";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import "@/lib/i18n";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-line/80 bg-soft/20 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value || "-"}</p>
    </div>
  );
}

export function ProviderCompanyProfileContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const p = user?.provider_profile;
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h1 className="font-display text-2xl font-extrabold text-ink">
          {t("providerDashboard.companyProfile.title", { defaultValue: "Company Profile" })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("providerDashboard.companyProfile.subtitle", {
            defaultValue: "Your organization details and contact information.",
          })}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <Row label="Provider Type" value={p?.provider_type} />
        <Row label="Full Name" value={p?.full_name} />
        <Row label="Business Name" value={p?.legal_name} />
        <Row label="Email" value={p?.email ?? user?.email} />
        <Row label="Phone" value={p?.phone} />
        <Row label="Primary Mode" value={p?.primary_mode} />
        <Row label="Pincode" value={p?.pincode} />
        <Row label="Area" value={p?.area} />
        <Row label="Locality" value={p?.locality} />
        <Row label="City" value={p?.city} />
        <Row label="District" value={p?.district} />
        <Row label="State" value={p?.state} />
      </section>
    </div>
  );
}
