import availableLocales from "@/lib/staticData/available_locales.json";

export type Locale = keyof typeof availableLocales;

export function isValidLocale(code: string): code is Locale {
  return code in availableLocales;
}

/**
 * Whether a user may translate into `locale`.
 *
 * ASSUMPTION: translators carry a `translator_<locale>` entry in `user.roles`
 * (e.g. `translator_fr`), and `wst_admin` may translate any locale. This is the
 * single seam to rewire once the real translator roster (from the Rails
 * translators page) is exposed to Payload.
 */
export function canTranslateLocale(
  roles: string[] | undefined | null,
  locale: string,
): boolean {
  if (!roles) return false;
  if (roles.includes("wst_admin")) return true;
  return roles.includes(`translator_${locale}`);
}
