"use server";

import i18next from "./i18n";
import { storageKey, defaultNamespace } from "./settings";
import { resolveLanguage } from "./resolveLanguage";
import { cookies, headers } from "next/headers";

import type { UseTranslationOptions } from "react-i18next";

export async function getT(
  options?: UseTranslationOptions<typeof defaultNamespace>,
) {
  const cookieList = await cookies();
  const headerList = await headers();

  const lng = resolveLanguage(
    cookieList.get(storageKey)?.value,
    headerList.get("Accept-Language"),
  );

  return {
    t: i18next.getFixedT(lng, defaultNamespace, options?.keyPrefix),
    i18n: i18next,
    lng,
  };
}
