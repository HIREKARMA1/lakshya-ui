"use client";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export function ReferEarn() {
  const { t } = useTranslation();
  const bullets = (t("refer.bullets", { returnObjects: true }) as string[]) ?? [];

  return (
    <section id="seekers-band" className="relative overflow-hidden bg-primary text-white">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky/40 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-yellow/30 blur-2xl" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-yellow">
            {t("refer.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">
            {t("refer.title")}{" "}
            <span className="text-yellow">{t("refer.amount")}</span>{" "}
            {t("refer.afterAmount")}
          </h2>
          <p className="mt-5 max-w-xl text-white/85">{t("refer.body")}</p>
          <Link
            href="/jobs"
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-yellow px-6 py-3.5 text-sm font-bold text-ink hover:bg-yellow/90"
          >
            {t("refer.cta")} →
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/15 lg:col-span-5">
          {bullets.map((b, i) => (
            <li key={i} className="bg-primary px-5 py-6">
              <span className="font-display text-3xl font-extrabold text-yellow">
                0{i + 1}
              </span>
              <p className="mt-2 text-sm font-semibold leading-snug text-white">{b}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
