import { I18n } from 'i18n-js';

const i18nFileContext = require.context('rails_translations');

function loadTranslations(i18n, locale) {
  const translations = i18nFileContext(`./${locale}.json`);
  i18n.store(translations);
}

window.I18n = window.I18n || new I18n();

// We always load English + the user locale so that we can fallback.
window.I18n.defaultLocale = 'en';
window.I18n.enableFallback = true;
// load the actual locale as determined by app/views/layouts/application.html.erb
window.I18n.locale = window.wca.currentLocale;
export default window.I18n;

// store the actual translations.
loadTranslations(window.I18n, 'en');
loadTranslations(window.I18n, window.wca.currentLocale);
