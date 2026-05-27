"use client";

import { useTranslation } from "react-i18next";
import { BookOpen, Clock, Mail, MessageCircle, Phone, Shield } from "lucide-react";
import { config } from "@/lib/config";
import "@/lib/i18n";

type FaqItem = { q: string; a: string };
type GuideItem = { title: string; body: string };

function readList<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function HelpContent() {
  const { t } = useTranslation();
  const faqs = readList<FaqItem>(t("dashboard.help.faqs", { returnObjects: true }));
  const guides = readList<GuideItem>(t("dashboard.help.guides", { returnObjects: true }));
  const safetyItems = readList<string>(t("dashboard.help.safetyItems", { returnObjects: true }));

  const cardCls = "rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6";

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t("dashboard.help.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t("dashboard.help.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-6 lg:col-span-8">
          <section className={cardCls}>
            <h2 className="font-display text-lg font-bold text-ink">{t("dashboard.help.faqTitle")}</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {faqs.map((faq) => (
                <li
                  key={faq.q}
                  className="rounded-lg border border-line/80 bg-soft/15 p-4 sm:p-5"
                >
                  <p className="text-sm font-semibold text-ink">{faq.q}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className={cardCls}>
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="font-display text-lg font-bold text-ink">{t("dashboard.help.guidesTitle")}</h2>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {guides.map((g) => (
                <li key={g.title} className="rounded-lg border border-line/80 bg-soft/10 p-4">
                  <p className="text-sm font-semibold text-ink">{g.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-4 lg:col-span-4 lg:self-start">
          <section className={cardCls}>
            <h2 className="font-display text-lg font-bold text-ink">{t("dashboard.help.contactTitle")}</h2>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={config.contact.phone ? `tel:${config.contact.phone}` : "#"}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden />
                {t("dashboard.help.call")}
              </a>
              <a
                href={config.contact.whatsapp ? `https://wa.me/${config.contact.whatsapp}` : "#"}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                {t("dashboard.help.whatsapp")}
              </a>
              {config.contact.email ? (
                <a
                  href={`mailto:${config.contact.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-soft"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  {t("dashboard.help.emailCta")}
                </a>
              ) : null}
            </div>
          </section>

          <section className={cardCls}>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-ink">
                <Clock className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="font-display text-lg font-bold text-ink">{t("dashboard.help.hoursTitle")}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("dashboard.help.hoursBody")}</p>
          </section>

          <section className={cardCls}>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-green/10 text-green">
                <Shield className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="font-display text-lg font-bold text-ink">{t("dashboard.help.safetyTitle")}</h2>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t("dashboard.help.safetyBody")}</p>
            {safetyItems.length > 0 ? (
              <ul className="list-inside list-disc space-y-2 text-sm text-ink marker:text-primary">
                {safetyItems.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
