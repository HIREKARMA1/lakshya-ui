"use client";

import { useTranslation } from "react-i18next";
import { MarketingPageHeader } from "@/components/landing/MarketingPageHeader";
import "@/lib/i18n";

export function ContactPageHeader() {
  const { t } = useTranslation();
  return (
    <MarketingPageHeader
      eyebrow={t("pages.contact.eyebrow")}
      title={t("pages.contact.title")}
      subtitle={t("pages.contact.subtitle")}
    />
  );
}
