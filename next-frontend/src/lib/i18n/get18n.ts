"use server";

import i18next from "./i18n";
import { storageKey, fallbackLng } from "./settings";
import { cookies, headers } from "next/headers";

export async function getT(options?: { keyPrefix?: string }) {
  const cookieList = await cookies();
  const headerList = await headers();
  const lng =
    cookieList.get(storageKey)?.value ||
    headerList.get("accept-language") ||
    fallbackLng;
  if (i18next.resolvedLanguage !== lng) {
    await i18next.changeLanguage(lng);
  }
  return {
    t: i18next.getFixedT(lng, "translation", options?.keyPrefix),
    i18n: i18next,
  };
}
