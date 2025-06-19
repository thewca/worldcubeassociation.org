"use client";

import { useTranslation } from "react-i18next";
import { storageKey } from "@/lib/i18n/settings";
import Cookies from "js-cookie";
import "./i18n";

export function useT(options?: object) {
  const lng = Cookies.get(storageKey);

  return useTranslation("translation", { ...options, lng });
}
