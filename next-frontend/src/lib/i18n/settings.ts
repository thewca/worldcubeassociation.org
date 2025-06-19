import availableLocales from "./locales/available.json";

export const fallbackLng = "en";
export const languages = Object.keys(availableLocales);

export const storageKey = "i18next-lng";
export const defaultNamespace = "translation";
