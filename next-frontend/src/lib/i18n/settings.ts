import availableLocales from "./locales/available.json";

type AvailableLocale = typeof availableLocales;

type LanguageCode = keyof AvailableLocale;
type LocaleConfig = AvailableLocale[LanguageCode];

export const fallbackLng: LanguageCode = "en";
export const languages: LanguageCode[] = Object.keys(
  availableLocales,
) as LanguageCode[];

export const languageConfig: Record<LanguageCode, LocaleConfig> =
  availableLocales;

export const storageKey = "i18next-lng";
export const defaultNamespace = "translation";

const isValidLanguageCode = (code: string): code is LanguageCode =>
  code in availableLocales;

export const coerceLanguageCode = (
  isoCode: string,
  fallback: LanguageCode = fallbackLng,
): LanguageCode => (isValidLanguageCode(isoCode) ? isoCode : fallback);
