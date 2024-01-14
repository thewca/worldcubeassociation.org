import get from "lodash/get";

import { Dict, Scope } from "../typing";
import { I18n } from "../I18n";
import { isSet } from "./isSet";
import { getFullScope } from "./getFullScope";
import { inferType } from "./inferType";

/**
 * Find and process the translation using the provided scope and options.
 * This is used internally by some functions and should not be used as a
 * public API.
 *
 * @private
 *
 * @param {I18n} i18n The I18n instance.
 *
 * @param {Scope} scope The translation scope.
 *
 * @param {Dict|undefined} options The lookup options.
 *
 * @returns {string} The resolved translation.
 */
export function lookup(i18n: I18n, scope: Scope, options: Dict = {}): any {
  options = { ...options };

  const locale = "locale" in options ? options.locale : i18n.locale;
  const localeType = inferType(locale);

  const locales = i18n.locales
    .get(localeType === "string" ? locale : typeof locale)
    .slice();

  scope = getFullScope(i18n, scope, options)
    .split(i18n.defaultSeparator)
    .map((component) => i18n.transformKey(component))
    .join(".");

  const entries = locales.map((locale) =>
    get(i18n.translations, [locale, scope].join(".")),
  );

  entries.push(options.defaultValue);

  return entries.find((entry) => isSet(entry));
}
