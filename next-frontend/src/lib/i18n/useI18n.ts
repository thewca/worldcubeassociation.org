"use client";

import i18next from "./i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function useT(options?: object) {
  const lng = localStorage.getItem("i18nextLng");
  const [activeLng, setActiveLng] = useState(i18next.resolvedLanguage);
  useEffect(() => {
    if (activeLng === i18next.resolvedLanguage) return;
    setActiveLng(i18next.resolvedLanguage);
  }, [activeLng]);
  useEffect(() => {
    if (!lng || i18next.resolvedLanguage === lng) return;
    i18next.changeLanguage(lng);
  }, [lng]);
  return useTranslation("translation", options);
}
