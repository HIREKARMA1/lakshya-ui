"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Job } from "@/types/job";
import "@/lib/i18n";

interface Stat { k: string; v: string }

export function Hero() {
  const { t } = useTranslation();
  const stats = (t("hero.stats", { returnObjects: true }) as Stat[]) ?? [];
  const { data } = useQuery({
    queryKey: ["public-jobs", "hero"],
    queryFn: () => api.searchPublicJobs({ limit: 8 }),
    retry: false,
  });
  const jobs: Job[] = data?.jobs ?? [];

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="lk-grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      {/* color accent ribbons — not a card, a chromatic strip */}
      <div className="absolute right-0 top-24 hidden h-2 w-[55%] lg:block" aria-hidden>
        <div className="flex h-full">
          <div className="flex-1 bg-primary" />
          <div className="flex-1 bg-sky" />
          <div className="flex-1 bg-yellow" />
          <div className="flex-1 bg-orange" />
          <div className="flex-1 bg-red" />
          <div className="flex-1 bg-green" />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-20">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green" />
            {t("hero.eyebrow")}
          </div>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-ink sm:text-5xl lg:text-[64px]">
            <span className="block">{t("hero.title1")}</span>
            <span className="block text-primary">{t("hero.title2")}</span>
            <span className="block">
              <span className="lk-underline">{t("hero.title3")}</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/find-seekers"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              {t("hero.primaryCta")}
              <ArrowRight />
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center rounded-md border border-ink/15 bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
            >
              {t("hero.secondaryCta")}
            </Link>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
            {stats.map((s) => (
              <div key={s.v} className="bg-white px-3 py-4 text-center sm:px-4">
                <dt className="font-display text-xl font-extrabold text-ink sm:text-2xl">{s.k}</dt>
                <dd className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          {jobs.length > 0 ? <HeroVisual jobs={jobs} /> : null}
        </div>
      </div>
    </section>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="ml-2">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeroVisual({ jobs }: { jobs: Job[] }) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState<"in" | "out">("in");

  useEffect(() => {
    if (jobs.length <= 1) return;
    const interval = setInterval(() => {
      setAnim("out");
      setTimeout(() => {
        setIdx((p) => (p + 1) % jobs.length);
        setAnim("in");
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [jobs.length]);

  const job = jobs[idx];
  const roleName = t(`roles.${job.roleKey}`);
  const posted =
    job.postedDays <= 1 ? t("common.today") : t("common.daysAgo", { n: job.postedDays });

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="absolute inset-x-6 top-6 bottom-0 rounded-tl-[120px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-primary" />
      <div className="absolute left-0 top-0 h-28 w-28 rounded-2xl bg-yellow" />
      <div className="absolute right-2 bottom-10 h-20 w-20 rounded-full bg-orange" />
      <div className="absolute left-2 bottom-2 h-14 w-14 rotate-12 rounded-md bg-sky" />
      <div
        key={job.id}
        className={`absolute left-1/2 top-1/2 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-2xl ring-1 ring-ink/5 transition-all duration-400 ease-out ${
          anim === "in"
            ? "opacity-100 translate-y-[-50%] scale-100"
            : "opacity-0 translate-y-[-60%] scale-95"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-green">
            {job.verified ? t("common.verified") : t("common.new")} · {posted}
          </span>
          <span className="text-[10px] text-muted-foreground">{job.city}</span>
        </div>
        <p className="mt-2 font-display text-lg font-bold text-ink">{roleName}</p>
        <p className="text-xs text-muted-foreground">{job.company}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("common.monthly")}</p>
            <p className="font-display text-xl font-extrabold text-primary">
              ₹{(job.salaryMin / 1000).toFixed(0)}k–{(job.salaryMax / 1000).toFixed(0)}k
            </p>
          </div>
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-primary/90"
          >
            {t("hero.card.apply")}
          </Link>
        </div>
        <div className="mt-4 h-px w-full bg-line" />
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green" />
          {job.openings > 1
            ? t("hero.card.openings_plural", { n: job.openings })
            : t("hero.card.openings", { n: job.openings })}{" "}
          · {t("common.applied", { n: job.applied })}
        </div>
      </div>
    </div>
  );
}
