"use server";

import i18next from "./i18n";
import {
  storageKey,
  fallbackLng,
  languages,
  defaultNamespace,
} from "./settings";
import { cookies, headers } from "next/headers";
import parser from "accept-language-parser";

import type { UseTranslationOptions } from "react-i18next";

export async function getT(
  options?: UseTranslationOptions<typeof defaultNamespace>,
) {
  const cookieList = await cookies();
  const headerList = await headers();

  const acceptLanguage = parser.pick(
    languages,
    headerList.get("Accept-Language") ?? [],
  );

  const lng =
    cookieList.get(storageKey)?.value || acceptLanguage || fallbackLng;

  return {
    t: i18next.getFixedT(lng, defaultNamespace, options?.keyPrefix),
    i18n: i18next,
  };
}
