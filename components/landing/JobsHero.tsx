"use client";

import { MapPin, Briefcase, Zap, IndianRupee, Wrench, FileText } from "lucide-react";
import Image from "next/image";

interface Fact { k: string; v: string }

const FACT_ICONS = [MapPin, Briefcase, Zap];
const STRIP_ICONS = [IndianRupee, Wrench, FileText];

export function JobsHero({
  kicker,
  title,
  subtitle,
  facts,
  strip,
}: {
  kicker?: string;
  title: string;
  subtitle: string;
  facts: Fact[];
  strip: Fact[];
  searchPh?: string;
  searchCta?: string;
  searchValue?: string;
  onSearch?: (v: string) => void;
}) {
  const factsArr = Array.isArray(facts) ? facts : [];
  const stripArr = Array.isArray(strip) ? strip : [];

  return (
    <section className="relative isolate">
      {/* Blue gradient banner */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background:
            "linear-gradient(115deg, #103a76 0%, #1b52a4 55%, #1e63c4 100%)",
        }}
      >
        {/* subtle decorative blobs */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse, #fec40d 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="grid items-center gap-4 px-5 py-4 sm:grid-cols-[1fr_auto] sm:px-8 sm:py-5">
          {/* Left: text + facts */}
          <div className="min-w-0">
            {kicker && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-yellow">
                {kicker}
              </p>
            )}
            <h1 className="mt-1 max-w-2xl font-display text-xl font-extrabold leading-tight text-white sm:text-2xl lg:text-[28px]">
              {title}
            </h1>
            <p className="mt-1.5 max-w-xl text-xs text-white/85 sm:text-sm">{subtitle}</p>

            {/* Inline fact chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {factsArr.map((f, i) => {
                const Icon = FACT_ICONS[i] ?? MapPin;
                return (
                  <div
                    key={f.k}
                    className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-white/15 text-white">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/70">
                        {f.k}
                      </p>
                      <p className="text-xs font-bold text-white sm:text-sm">{f.v}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: illustration */}
          <div className="hidden shrink-0 sm:block">
            <Image
              src="/assets/jobs-illustration.png"
              alt=""
              width={180}
              height={220}
              className="h-32 w-auto drop-shadow-xl lg:h-40"
            />

          </div>
        </div>
      </div>

      {/* Strip below banner */}
      <div className="mt-3 grid grid-cols-1 overflow-hidden rounded-xl border border-line bg-white shadow-sm sm:grid-cols-3">
        {stripArr.map((s, i) => {
          const Icon = STRIP_ICONS[i] ?? IndianRupee;
          return (
            <div
              key={s.k}
              className="flex items-center gap-2.5 px-4 py-2.5 sm:border-r sm:border-line sm:last:border-r-0"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" />
              </span>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.k}
                </p>
                <p className="truncate text-sm font-bold text-ink">{s.v}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
