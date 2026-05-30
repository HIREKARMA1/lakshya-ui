"use client";

import { useTranslation } from "react-i18next";
import { MarketingPageHeader } from "@/components/landing/MarketingPageHeader";
import "@/lib/i18n";

export function AboutPageHeader() {
  const { t } = useTranslation();
  return (
    <MarketingPageHeader
      eyebrow={t("pages.about.eyebrow")}
      title={t("pages.about.title")}
      subtitle={t("pages.about.subtitle")}
    />
  );
}
