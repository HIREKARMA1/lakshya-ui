"use client";

import { useTranslation } from "react-i18next";
import "@/lib/i18n";

type Milestone = { year: string; title: string; body: string };

function readMilestones(v: unknown): Milestone[] {
  return Array.isArray(v) ? (v as Milestone[]) : [];
}

export function AboutJourneySection() {
  const { t } = useTranslation();
  const milestones = readMilestones(t("pages.about.journey.milestones", { returnObjects: true }));

  return (
    <section className="border-b border-line bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-yellow">
            {t("pages.about.journey.eyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t("pages.about.journey.title")}</h2>
          <p className="mt-3 text-white/70">{t("pages.about.journey.subtitle")}</p>
        </div>

        <ol className="relative mt-12 space-y-0 border-l-2 border-white/20 pl-8 sm:pl-10">
          {milestones.map((m, i) => (
            <li key={m.year} className={`relative pb-10 ${i === milestones.length - 1 ? "pb-0" : ""}`}>
              <span
                className="absolute -left-[calc(2rem+5px)] top-1 grid h-3 w-3 place-items-center rounded-full bg-yellow sm:-left-[calc(2.5rem+5px)]"
                aria-hidden
              />
              <time className="font-display text-sm font-bold uppercase tracking-widest text-yellow">{m.year}</time>
              <h3 className="mt-1 font-display text-xl font-bold">{m.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{m.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
