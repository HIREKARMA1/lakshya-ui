import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "@/data/locales/en.json";
import hi from "@/data/locales/hi.json";
import or from "@/data/locales/or.json";
import jobRolesEn from "@/data/content/job-roles.en.json";
import jobRolesHi from "@/data/content/job-roles.hi.json";
import jobRolesOr from "@/data/content/job-roles.or.json";

function withJobRoles<T extends Record<string, unknown>>(base: T, jobRoles: Record<string, unknown>) {
  return { ...base, jobRoles };
}

export const SUPPORTED_LANGS = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
] as const;

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: withJobRoles(en, jobRolesEn) },
        hi: { translation: withJobRoles(hi, jobRolesHi) },
        or: { translation: withJobRoles(or, jobRolesOr) },
        // Some browsers/languages use `od` instead of `or` for Odia.
        od: { translation: withJobRoles(or, jobRolesOr) },
      },
      fallbackLng: "en",
      supportedLngs: ["en", "hi", "or", "od"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "lakshya-lang",
      },
      /** e.g. en-US → en so keys match bundled resources */
      load: "languageOnly",
      returnObjects: true,
      react: { useSuspense: false },
    });
}

export default i18n;
