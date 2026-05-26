"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { DottedTrails, WorkerBubbles } from "@/components/auth/AuthDecor";
import "@/lib/i18n";

export function RegisterShell({
  side,
  children,
}: {
  side: { title: string; subtitle: string; accent: "provider" | "seeker" };
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-soft">
      <DottedTrails />
      <WorkerBubbles />

      <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:py-5">
        <Link href="/" className="flex items-center">
          <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={140} height={56} className="h-12 w-auto sm:h-14" />
        </Link>
        <LanguageSwitcher />
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 px-4 pb-16 pt-2 lg:grid-cols-2 lg:gap-10 lg:pt-8">
        <div className="hidden lg:block">
          <h1
            className={`font-display text-4xl font-extrabold leading-tight xl:text-5xl ${
              side.accent === "seeker" ? "text-primary" : "text-[#1b52a4]"
            }`}
          >
            {side.title}
          </h1>
          <p className="mt-4 max-w-md text-base font-medium italic text-primary/70">
            {side.subtitle}
          </p>
        </div>

        <div className="lg:order-2">
          <div className="relative mx-auto w-full max-w-xl rounded-2xl border border-line bg-white p-5 shadow-xl shadow-primary/5 sm:p-8">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

export function StepHeader({
  title,
  step,
  total,
  label,
  accent,
}: {
  title: string;
  step: number;
  total: number;
  label: string;
  accent: "provider" | "seeker";
}) {
  const pct = Math.round((step / total) * 100);
  const accentText = accent === "seeker" ? "text-primary" : "text-[#1b52a4]";
  const accentBar = accent === "seeker" ? "bg-primary" : "bg-[#1b52a4]";
  return (
    <div className="mb-6">
      <h2 className={`text-center font-display text-2xl font-extrabold sm:text-3xl ${accentText}`}>
        {title}
      </h2>
      <div className="mt-5 flex items-center justify-between text-sm">
        <StepOfLabel step={step} total={total} label={label} />
        <span className={`font-bold ${accentText}`}>{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-orange/30">
        <div className={`h-full ${accentBar} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-red">*</span>}
        {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function StepNav({
  onPrev,
  onNext,
  nextLabel,
  prevLabel,
  accent,
  isFirst,
  isLast,
}: {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel?: string;
  prevLabel?: string;
  accent: "provider" | "seeker";
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const accentBg =
    isLast
      ? accent === "seeker"
        ? "bg-[#f15a2b] hover:bg-[#d94f23]"
        : "bg-[#1b52a4] hover:bg-[#15418a]"
      : accent === "seeker"
      ? "bg-primary hover:bg-primary/90"
      : "bg-[#1b52a4] hover:bg-[#15418a]";
  return (
    <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
      {isFirst ? (
        <Link
          href={accent === "seeker" ? "/login/seeker" : "/login/provider"}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink"
        >
          ← <PrevLabel fallback={prevLabel} />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink"
        >
          ← <PrevLabel isPrevious />
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className={`inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${accentBg}`}
      >
        <NextLabel fallback={nextLabel} isLast={isLast} />
      </button>
    </div>
  );
}

function StepOfLabel({ step, total, label }: { step: number; total: number; label: string }) {
  const { t } = useTranslation();
  return (
    <span className="font-medium text-ink">
      {t("common.stepOf", { step, total })}{" "}
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function PrevLabel({ fallback, isPrevious }: { fallback?: string; isPrevious?: boolean }) {
  const { t } = useTranslation();
  if (fallback) return <>{fallback}</>;
  return <>{isPrevious ? t("common.previous") : t("common.backToLogin")}</>;
}

function NextLabel({ fallback, isLast }: { fallback?: string; isLast?: boolean }) {
  const { t } = useTranslation();
  const label = fallback ?? t("common.next");
  return (
    <>
      {label} {isLast ? "✓" : "›"}
    </>
  );
}
