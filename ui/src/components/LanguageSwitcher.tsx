import { Languages } from "lucide-react";

import { getLocale, setLocale, useTranslation } from "@/i18n";
import { localeLabels, supportedLocales, type SupportedLocale } from "@/i18n/locales";
import { NativeSelect } from "@/components/ui/select";
import { authApi } from "@/api/auth";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const locale = supportedLocales.includes(i18n.language as SupportedLocale)
    ? i18n.language as SupportedLocale
    : getLocale();

  async function handleChange(nextLocale: string) {
    if (!supportedLocales.includes(nextLocale as SupportedLocale)) return;
    const locale = nextLocale as SupportedLocale;
    await setLocale(locale);
    try {
      await authApi.updatePreferences({ locale });
    } catch (error) {
      console.warn("Failed to persist interface language preference", error);
    }
  }

  return (
    <div className={compact ? "flex items-center gap-2 px-2.5 py-1.5" : "space-y-2"}>
      <label
        htmlFor="paperclip-language"
        className={compact ? "flex min-w-0 items-center gap-2 text-xs text-muted-foreground" : "text-sm font-medium"}
      >
        <Languages className="size-4 shrink-0" aria-hidden="true" />
        <span>{compact ? t("common.language") : t("common.interfaceLanguage")}</span>
      </label>
      <NativeSelect
        id="paperclip-language"
        aria-label={t("common.interfaceLanguage")}
        value={locale}
        onChange={(event) => void handleChange(event.target.value)}
        className={compact ? "h-8 min-w-28 py-1 text-xs" : "max-w-sm"}
      >
        {supportedLocales.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {localeLabels[supportedLocale]}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
