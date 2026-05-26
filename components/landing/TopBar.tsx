"use client";
import { useTranslation } from "react-i18next";
import { config } from "@/lib/config";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function TopBar() {
  const { t } = useTranslation();
  return (
    <div className="w-full bg-ink text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 text-[11px] sm:text-xs">
        <div className="flex items-center gap-3 truncate">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green" />
          <span className="truncate opacity-90">{t("brand.tagline")}</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={config.contact.whatsapp ? `https://wa.me/${config.contact.whatsapp}` : "#"}
            className="hidden sm:inline opacity-90 hover:opacity-100"
          >
            {t("topbar.whatsapp")}
          </a>
          <a href={config.contact.phone ? `tel:${config.contact.phone}` : "#"} className="opacity-90 hover:opacity-100">
            {t("topbar.call")}
          </a>
          <span className="h-3 w-px bg-white/20" />
          <div className="text-white [&_button]:!text-white">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
