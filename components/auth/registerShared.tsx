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
  scrollableCard,
  cardTagline,
}: {
  side: { title: string; subtitle: string; accent: "provider" | "seeker"; kicker?: string };
  children: React.ReactNode;
  /** Fixed-height card with internal scroll (seeker signup). */
  scrollableCard?: boolean;
  /** Centered tagline under logo in card (matches login page). */
  cardTagline?: string;
}) {
  const accentText = side.accent === "seeker" ? "text-primary" : "text-[#1b52a4]";

  return (
    <main
      className={`relative overflow-hidden bg-soft ${scrollableCard ? "min-h-screen lg:h-[100dvh]" : "min-h-screen"}`}
    >
      <DottedTrails />
      <WorkerBubbles />

      <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center">
          <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={140} height={56} className="h-14 w-auto sm:h-16" priority />
        </Link>
        <LanguageSwitcher />
      </header>

      <section
        className={`relative z-10 mx-auto grid max-w-7xl px-4 lg:grid-cols-2 ${
          scrollableCard
            ? "items-center gap-12 pb-12 pt-6 lg:gap-8 lg:pb-16 lg:pt-8"
            : "items-center gap-8 pb-16 pt-2 lg:gap-10 lg:pt-6"
        }`}
      >
        <div className={scrollableCard ? "order-2 lg:order-1" : "hidden lg:block"}>
          {side.kicker ? (
            <p className={`text-xs font-bold uppercase tracking-[0.25em] ${accentText}`}>{side.kicker}</p>
          ) : null}
          <h1
            className={`mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl ${
              side.accent === "seeker" ? "text-primary lg:whitespace-nowrap" : "text-[#1b52a4]"
            }`}
          >
            {side.title}
          </h1>
          <p
            className={`mt-4 max-w-md text-base font-medium ${
              side.accent === "seeker" ? "text-primary/80" : "italic text-primary/70"
            }`}
          >
            {side.subtitle}
          </p>
          {scrollableCard && side.accent === "seeker" ? (
            <div className="mt-8 flex gap-1.5" aria-hidden>
              <span className="h-1 w-12 bg-primary" />
              <span className="h-1 w-8 bg-sky" />
              <span className="h-1 w-4 bg-yellow" />
              <span className="h-1 w-4 bg-orange" />
              <span className="h-1 w-4 bg-green" />
            </div>
          ) : null}
        </div>

        <div className={scrollableCard ? "order-1 lg:order-2" : "lg:order-2"}>
          {scrollableCard && cardTagline ? (
            <AuthRegisterCard accent={side.accent} tagline={cardTagline}>
              {children}
            </AuthRegisterCard>
          ) : (
            <div className="relative mx-auto w-full max-w-xl rounded-2xl border border-line bg-white p-5 shadow-xl shadow-primary/5 sm:p-8">
              {children}
            </div>
          )}
        </div>
      </section>
      {scrollableCard ? <RegisterCardScrollStyles /> : null}
    </main>
  );
}

/** Login-matching card frame: yellow/corner chips, logo, tagline, internal scroll body. */
export function AuthRegisterCard({
  accent,
  tagline,
  children,
}: {
  accent: "provider" | "seeker";
  tagline: string;
  children: React.ReactNode;
}) {
  const accentChip = accent === "seeker" ? "bg-sky" : "bg-[#f15a2b]";
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -left-3 -top-3 h-16 w-16 rounded-2xl bg-yellow" aria-hidden />
      <div className={`absolute -right-3 -bottom-3 h-20 w-20 rounded-2xl ${accentChip}`} aria-hidden />
      <div className="relative flex h-[min(calc(100dvh-10rem),620px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-white p-7 shadow-xl shadow-primary/5 sm:p-8">
        <div className="shrink-0 text-center">
          <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={120} height={48} className="mx-auto h-12 w-auto" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">{tagline}</p>
        </div>
        <div className="mt-6 flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

export const registerCardScrollCls =
  "register-card-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]";

function RegisterCardScrollStyles() {
  return (
    <style>{`.register-card-scroll::-webkit-scrollbar{width:4px}.register-card-scroll::-webkit-scrollbar-track{background:transparent}.register-card-scroll::-webkit-scrollbar-thumb{background:#e8edf3;border-radius:999px}.register-card-scroll::-webkit-scrollbar-thumb:hover{background:#d1dae6}.register-card-scroll{scrollbar-width:thin;scrollbar-color:#e8edf3 transparent}`}</style>
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
    <div className="mb-4 shrink-0">
      {title.trim() ? (
        <h2 className={`text-center font-display text-2xl font-extrabold sm:text-3xl ${accentText}`}>
          {title}
        </h2>
      ) : null}
      <div className={`flex items-center justify-between text-sm ${title.trim() ? "mt-5" : "mt-0"}`}>
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
    <div className="mt-4 flex shrink-0 items-center justify-between gap-3 border-t border-line pt-4">
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
