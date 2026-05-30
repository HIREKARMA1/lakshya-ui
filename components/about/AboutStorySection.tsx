"use client";

import { useTranslation } from "react-i18next";
import "@/lib/i18n";

type Stat = { k: string; v: string };

function readStats(v: unknown): Stat[] {
  return Array.isArray(v) ? (v as Stat[]) : [];
}

export function AboutStorySection() {
  const { t } = useTranslation();
  const stats = readStats(t("pages.about.stats", { returnObjects: true }));

  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              {t("pages.about.storyEyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{t("pages.about.storyTitle")}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("pages.about.storyBody")}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("pages.about.storyBody2")}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line lg:col-span-5">
            {stats.map((s) => (
              <div key={s.v} className="bg-white px-3 py-5 text-center sm:px-4">
                <dt className="font-display text-xl font-extrabold text-ink sm:text-2xl">{s.k}</dt>
                <dd className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
