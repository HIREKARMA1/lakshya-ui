"use client";

import { useTranslation } from "react-i18next";
import "@/lib/i18n";

type Metric = { value: string; label: string; hint: string };

function readMetrics(v: unknown): Metric[] {
  return Array.isArray(v) ? (v as Metric[]) : [];
}

const ACCENT_BG = [
  "bg-primary text-white",
  "bg-orange text-white",
  "bg-green text-white",
  "bg-sky text-ink",
];

export function AboutImpactSection() {
  const { t } = useTranslation();
  const metrics = readMetrics(t("pages.about.impact.metrics", { returnObjects: true }));

  return (
    <section className="border-b border-line bg-soft">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {t("pages.about.impact.eyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{t("pages.about.impact.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("pages.about.impact.subtitle")}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <article
              key={m.label}
              className={`relative overflow-hidden rounded-2xl p-6 shadow-sm ${ACCENT_BG[i % ACCENT_BG.length]}`}
            >
              <p className="font-display text-4xl font-extrabold leading-none sm:text-5xl">{m.value}</p>
              <p className="mt-3 text-sm font-bold uppercase tracking-wide opacity-95">{m.label}</p>
              <p className="mt-2 text-xs leading-relaxed opacity-80">{m.hint}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
