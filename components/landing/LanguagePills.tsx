"use client";

import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGS } from "@/lib/i18n";
import { useEffect, useState } from "react";

type LanguagePillsProps = {
  className?: string;
  /** Show short codes (EN / HI / OD) instead of native script */
  compact?: boolean;
};

export function LanguagePills({ className = "", compact = false }: LanguagePillsProps) {
  const { i18n, t } = useTranslation();
  const [current, setCurrent] = useState(i18n.language?.slice(0, 2) ?? "en");

  useEffect(() => {
    const c = i18n.language?.slice(0, 2) ?? "en";
    setCurrent(c === "od" ? "or" : c);
    if (typeof document !== "undefined") {
      document.documentElement.lang = c === "or" ? "or" : c;
    }
  }, [i18n.language]);

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      role="group"
      aria-label={t("languageSwitcher.ariaSelect")}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("topbar.language")}:
      </span>
      {SUPPORTED_LANGS.map((lang) => {
        const code = lang.code;
        const isActive = current === code;
        const label = compact ? code.toUpperCase() : lang.native;
        return (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            aria-pressed={isActive}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              isActive
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-line bg-white text-ink hover:border-primary/40"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
