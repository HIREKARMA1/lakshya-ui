"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight, Briefcase, MessageCircle, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "@/lib/i18n";

type ExploreCard = { title: string; body: string; href: string; cta: string };

function readCards(v: unknown): ExploreCard[] {
  return Array.isArray(v) ? (v as ExploreCard[]) : [];
}

const CARD_ICONS: LucideIcon[] = [Briefcase, Users, MessageCircle];
const CARD_ACCENTS = ["border-primary/30 bg-primary/5", "border-orange/30 bg-orange/5", "border-green/30 bg-green/5"];

export function AboutExploreSection() {
  const { t } = useTranslation();
  const cards = readCards(t("pages.about.explore.cards", { returnObjects: true }));

  return (
    <section className="border-b border-line bg-soft">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {t("pages.about.explore.eyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{t("pages.about.explore.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("pages.about.explore.subtitle")}</p>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((card, i) => {
            const Icon = CARD_ICONS[i % CARD_ICONS.length];
            return (
              <li key={card.title}>
                <Link
                  href={card.href}
                  className={`group flex h-full flex-col rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-lg ${CARD_ACCENTS[i % CARD_ACCENTS.length]}`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-white shadow-sm">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{card.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2">
                    {card.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
