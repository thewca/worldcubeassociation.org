import { I18n } from 'i18n-js';

const DEFAULT_LOCALE = 'en';

/**
 * Use when I18n.t should return an array.
 * Guards against non-arrays and removes empty elements from array.
 * @param {string | string[]} scope
 * @param {*} options
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
 * The global translation object.
 *
 * @example
 *  import I18n from '../../lib/i18n';
 *  I18n.t('regional_organizations.requirements.title'); // -> string
 *  I18n.tArray('regional_organizations.requirements.list'); // -> string[]
 *
 * @type {I18n & {
 *  tArray: (scope: string | string[], options?: *) => string[]
 * }}
 */
export default window.I18n;

function loadTranslations(i18n, locale) {
  import(`../rails_translations/${locale}.json`).then((translations) => {
    i18n.store(translations);
  }).catch((err) => {
    if(err){
      console.error(`Could not load translations because of ${err}, if this is test this is intended`)
    }
  });
}

// store the actual translations.
loadTranslations(window.I18n, DEFAULT_LOCALE);
loadTranslations(window.I18n, window.wca.currentLocale);
