"use server";

import i18next from "./i18n";
import {
  storageKey,
  fallbackLng,
  languages,
  defaultNamespace,
  coerceLanguageCode,
} from "./settings";
import { cookies, headers } from "next/headers";
import parser from "accept-language-parser";

import type { UseTranslationOptions } from "react-i18next";

export async function getT(
  options?: UseTranslationOptions<typeof defaultNamespace>,
) {
  const cookieList = await cookies();
  const headerList = await headers();

  // Browsers often send only a regional code like `de-DE`, which strict matching rejects. Loose
  //   matching alone would ignore regions entirely and serve `zh-CN` to a `zh-TW` reader, so each
  //   accepted language tries an exact match first.
  const acceptLanguage = parser
    .parse(headerList.get("Accept-Language") ?? undefined)
    .map(
      (accepted) =>
        parser.pick(languages, [accepted]) ??
        parser.pick(languages, [accepted], { loose: true }),
    )
    .find((picked) => picked !== null);

  const lngRaw =
    cookieList.get(storageKey)?.value || acceptLanguage || fallbackLng;

  const lng = coerceLanguageCode(lngRaw);

  return {
    t: i18next.getFixedT(lng, defaultNamespace, options?.keyPrefix),
    i18n: i18next,
    lng,
  };
}
