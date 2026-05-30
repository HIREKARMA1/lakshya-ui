"use client";

import { useTranslation } from "react-i18next";
import { Clock, MapPin, Shield } from "lucide-react";
import { HirekarmaCompanyText } from "@/components/shared/HirekarmaCompanyText";
import "@/lib/i18n";

export function ContactOfficeSection() {
  const { t } = useTranslation();
  const cardCls = "rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6";

  return (
    <section className={cardCls}>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <MapPin className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="font-display text-lg font-bold text-ink">{t("pages.contact.officeTitle")}</h2>
      </div>
      <HirekarmaCompanyText
        i18nKey="pages.contact.address"
        className="text-sm leading-relaxed text-muted-foreground"
      />
    </section>
  );
}

export function ContactHoursSection() {
  const { t } = useTranslation();
  const cardCls = "rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6";

  return (
    <section className={cardCls}>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-ink">
          <Clock className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="font-display text-lg font-bold text-ink">{t("pages.contact.hoursTitle")}</h2>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{t("pages.contact.hoursBody")}</p>
    </section>
  );
}

export function ContactSafetySection() {
  const { t } = useTranslation();
  const cardCls = "rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6";

  return (
    <section className={cardCls}>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-green/10 text-green">
          <Shield className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="font-display text-lg font-bold text-ink">{t("pages.contact.safetyTitle")}</h2>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{t("pages.contact.safetyBody")}</p>
    </section>
  );
}
