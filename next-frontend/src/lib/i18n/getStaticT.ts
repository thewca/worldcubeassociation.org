import i18next from "./i18n";
import { fallbackLng, defaultNamespace } from "./settings";

// Metadata is prerendered, so it cannot read the request locale from cookies/headers
// the way `getT` does. Titles are therefore always in the fallback language.
export async function getStaticT() {
  await i18next.loadLanguages(fallbackLng);
  return i18next.getFixedT(fallbackLng, defaultNamespace);
}
