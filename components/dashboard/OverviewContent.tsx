"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { FileText, Eye, Bookmark, Briefcase, Search, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import "@/lib/i18n";

function firstName(name?: string, email?: string) {
  const base = name?.trim() || email?.split("@")[0] || "there";
  return base.split(/\s+/)[0];
}

export function OverviewContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [city, setCity] = useState(user?.seeker_profile?.city ?? "");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const { data: bookmarks } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => api.listBookmarkedJobs(),
  });

  const { data: myStatus } = useQuery({
    queryKey: ["seeker-jobs-status"],
    queryFn: () => api.getSeekerJobsStatus(),
  });

  const savedCount = bookmarks?.total ?? 0;
  const applicationsCount = myStatus?.applied_job_ids?.length ?? 0;
  const name = firstName(user?.name, user?.email);

  const goJobs = (params: { city?: string; q?: string }) => {
    const sp = new URLSearchParams();
    if (params.city) sp.set("city", params.city);
    if (params.q) sp.set("q", params.q);
    const qs = sp.toString();
    router.push(qs ? `/dashboard/jobs?${qs}` : "/dashboard/jobs");
  };

  const stats = [
    {
      icon: FileText,
      label: t("dashboard.overview.stats.applications"),
      value: String(applicationsCount),
      hint: t("dashboard.overview.stats.applicationsHint"),
      color: "text-green",
    },
    {
      icon: Eye,
      label: t("dashboard.overview.stats.profileViews"),
      value: "0",
      hint: t("dashboard.overview.stats.profileViewsHint"),
      color: "text-green",
    },
    {
      icon: Bookmark,
      label: t("dashboard.overview.stats.savedJobs"),
      value: String(savedCount),
      hint: t("dashboard.overview.stats.savedHint", { n: savedCount }),
      color: "text-orange",
    },
    {
      icon: Briefcase,
      label: t("dashboard.overview.stats.matches"),
      value: "—",
      hint: t("dashboard.overview.stats.matchesHint"),
      color: "text-primary",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-[#2563eb] px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
        <div className="relative z-10 max-w-xl">
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{t("dashboard.overview.welcome", { name })}</h1>
          <p className="mt-2 text-sm text-white/90 sm:text-base">{t("dashboard.overview.subtitle")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-sm hover:bg-white/95"
            >
              {t("dashboard.overview.browseJobs")}
            </Link>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white/80 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10"
            >
              {t("dashboard.overview.updateProfile")}
            </Link>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-4 bottom-0 hidden h-40 w-40 rounded-full bg-white/10 sm:block"
          aria-hidden
        />
      </section>

      <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-bold text-ink">{t("dashboard.overview.citySearchTitle")}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("dashboard.overview.cityPh")}
              className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <button
            type="button"
            onClick={() => goJobs({ city })}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
          >
            {t("dashboard.overview.findJobsBtn")}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.overview.searchPh")}
              className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("dashboard.overview.locationPh")}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <button
            type="button"
            onClick={() => goJobs({ q: query, city: location || city })}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
          >
            {t("dashboard.overview.searchBtn")}
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-extrabold text-ink">{s.value}</p>
            <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-xs font-medium ${s.color}`}>{s.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
