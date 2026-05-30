"use client";

import { useTranslation } from "react-i18next";
import "@/lib/i18n";

type Highlight = { title: string; body: string };

function readHighlights(v: unknown): Highlight[] {
  return Array.isArray(v) ? (v as Highlight[]) : [];
}

const ACCENTS = ["bg-primary", "bg-orange", "bg-green"];

export function AboutHighlightsSection() {
  const { t } = useTranslation();
  const highlights = readHighlights(t("pages.about.highlights", { returnObjects: true }));

  if (!highlights.length) return null;

  return (
    <section className="border-b border-line bg-soft">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {t("pages.about.highlightsEyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{t("pages.about.highlightsTitle")}</h2>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {highlights.map((item, i) => (
            <li key={item.title} className="rounded-xl border border-line bg-white p-6 shadow-sm">
              <span className={`inline-block h-1 w-12 rounded-full ${ACCENTS[i % ACCENTS.length]}`} />
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
