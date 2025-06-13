import i18next from "./i18n";
// import { headerName } from "./settings";
// import { headers } from "next/headers";

export async function getT(options?: { keyPrefix?: string }) {
  // const headerList = await headers();
  const lng = "en";
  if (lng && i18next.resolvedLanguage !== lng) {
    await i18next.changeLanguage(lng);
  }
  return {
    t: i18next.getFixedT(
      lng ?? i18next.resolvedLanguage,
      "translation",
      options?.keyPrefix,
    ),
    i18n: i18next,
  };
}
