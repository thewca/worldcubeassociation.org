import availableLocales from "./locales/available.json";

type LanguageCode = keyof typeof availableLocales;

export const fallbackLng: LanguageCode = "en";
export const languages: LanguageCode[] = Object.keys(
  availableLocales,
) as LanguageCode[];

export const storageKey = "i18next-lng";
export const defaultNamespace = "translation";

const isValidLanguageCode = (code: string): code is LanguageCode =>
  code in availableLocales;

export const coerceLanguageCode = (
  isoCode: string,
  fallback: LanguageCode = fallbackLng,
): LanguageCode => (isValidLanguageCode(isoCode) ? isoCode : fallback);
