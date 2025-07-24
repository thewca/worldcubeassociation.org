"use client";

import { useTranslation } from "react-i18next";
import { storageKey, defaultNamespace } from "@/lib/i18n/settings";
import Cookies from "js-cookie";
import i18n from "./i18n";

import type { UseTranslationOptions } from "react-i18next";

export function useT(options?: UseTranslationOptions<typeof defaultNamespace>) {
  const lng = Cookies.get(storageKey);

  return useTranslation(defaultNamespace, { ...options, lng, i18n });
}
