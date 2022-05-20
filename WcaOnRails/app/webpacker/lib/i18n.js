import I18n from 'i18n-js';

window.I18n = window.I18n || I18n;
window.I18n.locale = window.wca.currentLocale;
// We always load English + the user locale so that we can fallback.
window.I18n.fallbacks = true;
export default window.I18n;
