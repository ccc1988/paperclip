import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import { DEFAULT_LOCALE, i18nextResources, supportedLocales, type SupportedLocale } from "./locales";

const LOCALE_STORAGE_KEY = "paperclip.locale";

function readStoredLocale(): SupportedLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored && supportedLocales.includes(stored) ? stored as SupportedLocale : DEFAULT_LOCALE;
}

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: readStoredLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

export function getLocale(): SupportedLocale {
  return (i18n.language && supportedLocales.includes(i18n.language)
    ? i18n.language
    : DEFAULT_LOCALE) as SupportedLocale;
}

export async function setLocale(locale: SupportedLocale) {
  if (!supportedLocales.includes(locale)) return;
  if (typeof window !== "undefined") window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  await i18n.changeLanguage(locale);
}

export const useTranslation = useReactI18nextTranslation;
export { i18n };
