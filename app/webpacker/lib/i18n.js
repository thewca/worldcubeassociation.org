import { I18n, useMakePlural } from 'i18n-js';

import { registerLocale, setDefaultLocale } from 'react-datepicker';
// This is created dynamically at asset build time
// English is always needed (default + fallback), so bundle it synchronously.
// eslint-disable-next-line import/no-unresolved
import enTranslations from 'rails_translations/en.json';
import dateFnsLocaleLoaders from './dateFnsLocales';

// All other locales are loaded lazily — only the user's locale is ever fetched.
const i18nLocaleContext = require.context('rails_translations', false, /\.json$/, 'lazy');

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

async function loadTranslationPluralizer(i18n, locale) {
  const baseLocale = locale.split('-')[0];
  const Pluralizers = await import('make-plural/plurals');
  const isoPluralizer = Pluralizers[baseLocale];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const i18nPluralizer = useMakePlural({ pluralizer: isoPluralizer });
  i18n.pluralization.register(locale, i18nPluralizer);
}

async function loadTranslations(i18n, locale) {
  const module = await i18nLocaleContext(`./${locale}.json`);
  i18n.store(module.default ?? module);
}

async function loadDateTimeLocale(locale) {
  // date-fns has no plain 'en' locale (only en-US, en-GB, etc.) — skip it.
  if (locale === DEFAULT_LOCALE) return;

  const loader = dateFnsLocaleLoaders[locale];
  if (!loader) return;

  const module = await loader();
  registerLocale(locale, module.default);
  setDefaultLocale(locale);
}

// Synchronous setup: English translations are bundled, and react-datepicker
// already ships English natively, so no date-fns registration is needed for it.
window.I18n.store(enTranslations);

const { currentLocale } = window.wca;

// Asynchronous setup: for any locale other than the default, fetch the
// translation and date-fns chunks in parallel.
const languageToLoad = [currentLocale].filter((iso) => iso !== DEFAULT_LOCALE);

export const i18nReady = Promise.all([
  // We always need to load english pluralizers
  loadTranslationPluralizer(window.I18n, DEFAULT_LOCALE),
  ...languageToLoad.map((iso) => Promise.all([
    loadTranslations(window.I18n, iso),
    loadDateTimeLocale(iso),
    loadTranslationPluralizer(window.I18n, iso),
  ])),
]);
