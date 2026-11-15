"use client";

import { useTranslation } from "react-i18next";
import { defaultNamespace } from "@/lib/i18n/settings";
import i18n from "./i18n";
import { useLocale } from "./LocaleProvider";

import type { UseTranslationOptions } from "react-i18next";

export function useT(options?: UseTranslationOptions<typeof defaultNamespace>) {
  const lng = useLocale();

  return useTranslation(defaultNamespace, { ...options, lng, i18n });
}
