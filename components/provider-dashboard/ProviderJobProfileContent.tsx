"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Briefcase } from "lucide-react";
import "@/lib/i18n";

type JobDraft = {
  role: string;
  openings: string;
  city: string;
  salaryMin: string;
  salaryMax: string;
  notes: string;
};

export function ProviderJobProfileContent() {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<JobDraft>({
    role: "",
    openings: "",
    city: "",
    salaryMin: "",
    salaryMax: "",
    notes: "",
  });

  const set = <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = () => {
    toast.success(
      t("providerDashboard.jobProfile.saved", {
        defaultValue: "Draft saved locally. API integration can be connected next.",
      }),
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Briefcase className="h-4 w-4" aria-hidden />
          </span>
          <h1 className="font-display text-2xl font-extrabold text-ink">
            {t("providerDashboard.jobProfile.title", { defaultValue: "Create Job Profile" })}
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("providerDashboard.jobProfile.subtitle", {
            defaultValue: "Capture role requirements so hiring and matching can run faster.",
          })}
        </p>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              {t("providerDashboard.jobProfile.fields.role", { defaultValue: "Role" })}
            </span>
            <input
              value={draft.role}
              onChange={(e) => set("role", e.target.value)}
              className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder={t("providerDashboard.jobProfile.fields.rolePh", {
                defaultValue: "e.g. Security Guard",
              })}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              {t("providerDashboard.jobProfile.fields.openings", { defaultValue: "Openings" })}
            </span>
            <input
              inputMode="numeric"
              value={draft.openings}
              onChange={(e) => set("openings", e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="1"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              {t("providerDashboard.jobProfile.fields.city", { defaultValue: "City" })}
            </span>
            <input
              value={draft.city}
              onChange={(e) => set("city", e.target.value)}
              className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder={t("providerDashboard.jobProfile.fields.cityPh", { defaultValue: "e.g. Bhubaneswar" })}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                {t("providerDashboard.jobProfile.fields.salaryMin", { defaultValue: "Min salary" })}
              </span>
              <input
                inputMode="numeric"
                value={draft.salaryMin}
                onChange={(e) => set("salaryMin", e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="12000"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                {t("providerDashboard.jobProfile.fields.salaryMax", { defaultValue: "Max salary" })}
              </span>
              <input
                inputMode="numeric"
                value={draft.salaryMax}
                onChange={(e) => set("salaryMax", e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="18000"
              />
            </label>
          </div>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              {t("providerDashboard.jobProfile.fields.notes", { defaultValue: "Requirements / notes" })}
            </span>
            <textarea
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={4}
              className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder={t("providerDashboard.jobProfile.fields.notesPh", {
                defaultValue: "Shift timing, preferred experience, joining timeline…",
              })}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            {t("providerDashboard.jobProfile.save", { defaultValue: "Save draft" })}
          </button>
        </div>
      </section>
    </div>
  );
}
