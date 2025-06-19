"use client";

import i18next from "./i18n";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { storageKey } from "@/lib/i18n/settings";
import Cookies from "js-cookie";

export function useT(options?: object) {
  const lng = Cookies.get(storageKey);
  useEffect(() => {
    if (!lng || i18next.resolvedLanguage === lng) return;
    i18next.changeLanguage(lng);
  }, [lng]);
  return useTranslation("translation", options);
}
