import { I18n, useMakePlural } from 'i18n-js';

import * as Locales from 'date-fns/locale';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import * as Pluralizers from 'make-plural/plurals';

const i18nFileContext = require.context('rails_translations');

export const DEFAULT_LOCALE = 'en';

/**
 * Use when I18n.t should return an array.
 * Guards against non-arrays and removes empty elements from array.
 * @param {string | string[]} scope
 * @param {*} options
 * @returns {string[]}
 */
function tArray(scope, options) {
  let res = window.I18n.t(scope, options);

  if (typeof res === 'object') {
    const resKeys = Object.keys(res);

    const maybeNumericKeys = resKeys.map(Number);
    maybeNumericKeys.sort();

    // Our i18n export library changed behavior in a minor version bump (sigh…) to maintain numeric
    // keys as JS objects even when the keys clearly indicate index ordering, implying an array.
    // We need to circumvent this behavior because we rely on external tools for our translators,
    // which require the YML to contain string keys (instead "proper" YML arrays)
    const isPseudoArray = maybeNumericKeys.every((key, idx) => key === (idx + 1));

    if (isPseudoArray) {
      res = maybeNumericKeys.map((key) => res[key.toString()]);
    }
  }

  if (!Array.isArray(res)) {
    // throw errors in same style as I18n.t:
    // return a valid result, just the error message not the content.
    return [`Expected Array from: ${scope}`];
  }

  return res.filter(Boolean);
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

export function withLocale(overrideLocale, fn) {
  const actualLocale = window.I18n.locale;

  try {
    window.I18n.locale = overrideLocale;
    return fn();
  } finally {
    window.I18n.locale = actualLocale;
  }
}

function loadTranslations(i18n, locale) {
  const translations = i18nFileContext(`./${locale}.json`);
  i18n.store(translations);
}

function loadTranslationPluralizer(i18n, locale) {
  const baseLocale = locale.split('-')[0];
  const isoPluralizer = Pluralizers[baseLocale];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const i18nPluralizer = useMakePlural({ pluralizer: isoPluralizer });
  i18n.pluralization.register(locale, i18nPluralizer);
}

function loadDateTimeLocale(locale) {
  const dateFnsLocale = Locales[locale];

  registerLocale(locale, dateFnsLocale);
  setDefaultLocale(locale);
}

// prepare the pluralizer rules.
loadTranslationPluralizer(window.I18n, window.wca.currentLocale);

// store the actual translations.
loadTranslations(window.I18n, DEFAULT_LOCALE);
loadTranslations(window.I18n, window.wca.currentLocale);

// load additional locales for third party code.
loadDateTimeLocale(window.wca.currentLocale);
