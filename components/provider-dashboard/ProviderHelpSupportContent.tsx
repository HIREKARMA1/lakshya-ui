"use client";

import { Phone, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { config } from "@/lib/config";
import "@/lib/i18n";

export function ProviderHelpSupportContent() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h1 className="font-display text-2xl font-extrabold text-ink">
          {t("providerDashboard.help.title", { defaultValue: "Help & Support" })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("providerDashboard.help.subtitle", {
            defaultValue: "Need assistance with hiring? Reach support on call or WhatsApp.",
          })}
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <a
          href={config.contact.phone ? `tel:${config.contact.phone}` : "#"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-4 py-4 text-sm font-semibold text-white hover:opacity-90"
        >
          <Phone className="h-4 w-4" />
          {t("providerDashboard.help.call", { defaultValue: "Call support" })}
        </a>
        <a
          href={config.contact.whatsapp ? `https://wa.me/${config.contact.whatsapp}` : "#"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <MessageCircle className="h-4 w-4" />
          {t("providerDashboard.help.whatsapp", { defaultValue: "Chat on WhatsApp" })}
        </a>
      </section>
    </div>
  );
}
