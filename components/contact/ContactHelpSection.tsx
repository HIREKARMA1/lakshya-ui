"use client";

import { useTranslation } from "react-i18next";
import "@/lib/i18n";

function readList(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

export function ContactHelpSection() {
  const { t } = useTranslation();
  const channels = readList(t("pages.contact.channels", { returnObjects: true }));
  const cardCls = "rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6";

  return (
    <section className={cardCls}>
      <h2 className="font-display text-xl font-bold text-ink">{t("pages.contact.helpTitle")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("pages.contact.helpBody")}</p>
      {channels.length > 0 ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {channels.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 rounded-lg border border-line/80 bg-soft/20 px-4 py-3 text-sm text-ink"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
