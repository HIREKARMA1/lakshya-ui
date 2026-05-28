"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

export function ProviderFindTeamContent() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" aria-hidden />
          </span>
          <h1 className="font-display text-2xl font-extrabold text-ink">
            {t("providerDashboard.findTeam.title", { defaultValue: "Find Your Team" })}
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("providerDashboard.findTeam.subtitle", {
            defaultValue: "Access verified worker profiles and filter by skill, city and experience.",
          })}
        </p>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-muted-foreground">
          {t("providerDashboard.findTeam.body", {
            defaultValue:
              "This section connects to the seeker search experience so you can discover and shortlist candidates quickly.",
          })}
        </p>
        <Link
          href="/find-seekers"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          {t("providerDashboard.findTeam.cta", { defaultValue: "Open candidate search" })}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
