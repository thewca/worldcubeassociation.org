import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const TRANSLATIONS_NAMESPACE = 'translations';

const shared = {
  interpolation: {
    escapeValue: false, // react already safes from xss
    prefix: '%{',
    suffix: '}',
  },
  useSuspense: false,
  defaultNS: TRANSLATIONS_NAMESPACE,
};
// Use the monoliths translations object
const monolithTranslations = {};
// Always load en as a fallback
monolithTranslations.en = {
  translations: window.I18n[TRANSLATIONS_NAMESPACE].en,
};
monolithTranslations[window.I18n.locale] = {
  translations: window.I18n[TRANSLATIONS_NAMESPACE][window.I18n.locale],
};
i18n.use(initReactI18next).init({
  ...shared,
  resources: monolithTranslations,
  fallbackLng: 'en',
  fallbackNS: TRANSLATIONS_NAMESPACE,
  lng: window.I18n.locale,
});

export default i18n;
