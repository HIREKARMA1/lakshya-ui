"use client";

import { useTranslation } from "react-i18next";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { contactDisplay, contactMailtoHref, contactTelHref, contactWhatsAppHref } from "@/lib/contact";
import "@/lib/i18n";

export function ContactReachSection() {
  const { t } = useTranslation();
  const cardCls = "rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6";

  return (
    <section className={cardCls}>
      <h2 className="font-display text-xl font-bold text-ink">{t("pages.contact.reachTitle")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("pages.contact.reachBody")}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {contactDisplay.phone ? (
          <a
            href={contactTelHref()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:min-w-[180px]"
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            {t("pages.contact.call")}
          </a>
        ) : null}
        {contactDisplay.whatsapp ? (
          <a
            href={contactWhatsAppHref()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 sm:min-w-[180px]"
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            {t("pages.contact.whatsapp")}
          </a>
        ) : null}
        {contactDisplay.email ? (
          <a
            href={contactMailtoHref()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-soft sm:min-w-[180px]"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            {t("pages.contact.emailCta")}
          </a>
        ) : null}
      </div>
      {contactDisplay.phone ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("pages.contact.phoneLabel")}:{" "}
          <a href={contactTelHref()} className="font-semibold text-primary hover:underline">
            {contactDisplay.phone}
          </a>
        </p>
      ) : null}
      {contactDisplay.whatsapp && contactDisplay.whatsapp !== contactDisplay.phone ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("pages.contact.whatsapp")}:{" "}
          <a href={contactWhatsAppHref()} className="font-semibold text-primary hover:underline">
            {contactDisplay.whatsapp}
          </a>
        </p>
      ) : null}
      {contactDisplay.email ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("pages.contact.emailLabel")}:{" "}
          <a href={contactMailtoHref()} className="font-semibold text-primary hover:underline">
            {contactDisplay.email}
          </a>
        </p>
      ) : null}
    </section>
  );
}
