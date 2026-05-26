"use client";
import { useTranslation } from "react-i18next";

interface Step { n: string; t: string; d: string }

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = (t("how.steps", { returnObjects: true }) as Step[]) ?? [];

  return (
    <section className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {t("how.eyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
            {t("how.title")}
          </h2>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.n} className="relative bg-white p-7">
              <div className="flex items-center justify-between">
                <span className="font-display text-5xl font-extrabold text-primary/15">
                  {s.n}
                </span>
                <span
                  className="h-1 w-12 rounded-full"
                  style={{
                    background:
                      i === 0 ? "var(--sky)" : i === 1 ? "var(--orange)" : "var(--green)",
                  }}
                />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-ink">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
