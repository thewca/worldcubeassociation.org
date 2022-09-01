import { I18n } from 'i18n-js';

const i18nFileContext = require.context('rails_translations');

const DEFAULT_LOCALE = 'en';

/**
 * @typedef {{
 *     defaultValue?: *,
 *     count?: number,
 *     scope?: string | string[],
 *     defaults?: Record<string, any>[],
 *     missingBehavior?: "message" | "guess" | "error" | string
 * } & Record<string, *>} TranslateOptions
 */

/**
 * @param {I18n} i18n
 * @param {string} locale
 */
function loadTranslations(i18n, locale) {
  const translations = i18nFileContext(`./${locale}.json`);
  i18n.store(translations);
}

/**
 * Use when I18n.t should return an array.
 * Guards against non-arrays and removes empty elements from array.
 * @param {string | string[]} scope
 * @param {TranslateOptions | undefined} options
 * @returns {string[]}
 */
function tArray(scope, options) {
  let res = window.I18n.t(scope, options);
  if (typeof res !== 'object' || !Array.isArray(res)) {
    // throw errors in same style as I18n.t:
    // return a valid result, just the error message not the content.
    return [`Expected Array from: ${scope}`];
  }
  res = res.filter(Boolean);
  return res;
}

window.I18n = window.I18n || new I18n();

// We always load English + the user locale so that we can fallback.
window.I18n.defaultLocale = DEFAULT_LOCALE;
window.I18n.enableFallback = true;
// load the actual locale as determined by app/views/layouts/application.html.erb
window.I18n.locale = window.wca.currentLocale;
window.I18n.tArray = tArray;

/**
 * Type hints for tArray too.
 * @type {I18n & {
 *  tArray: (scope: string | string[], options?: TranslateOptions) => string | string[]
 * }}
 */
export default window.I18n;

// store the actual translations.
loadTranslations(window.I18n, DEFAULT_LOCALE);
loadTranslations(window.I18n, window.wca.currentLocale);
