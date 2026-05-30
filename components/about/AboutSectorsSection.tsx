"use client";

import { useTranslation } from "react-i18next";
import { Building2, Shield, Truck, UtensilsCrossed, Wrench, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "@/lib/i18n";

type Sector = { name: string; body: string };

function readSectors(v: unknown): Sector[] {
  return Array.isArray(v) ? (v as Sector[]) : [];
}

const ICONS: LucideIcon[] = [Truck, Wrench, UtensilsCrossed, Shield, Building2, Zap];
const ICON_BG = ["bg-primary/10 text-primary", "bg-orange/10 text-orange", "bg-yellow/30 text-ink", "bg-green/10 text-green", "bg-sky/20 text-primary", "bg-red/10 text-red"];

export function AboutSectorsSection() {
  const { t } = useTranslation();
  const sectors = readSectors(t("pages.about.sectors.items", { returnObjects: true }));

  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              {t("pages.about.sectors.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{t("pages.about.sectors.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("pages.about.sectors.subtitle")}</p>
          </div>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s, i) => {
            const Icon = ICONS[i % ICONS.length];
            const iconCls = ICON_BG[i % ICON_BG.length];
            return (
              <li
                key={s.name}
                className="group flex gap-4 rounded-xl border border-line bg-white p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${iconCls}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">{s.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
