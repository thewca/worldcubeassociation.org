import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";
import { fallbackLng, languages, storageKey } from "./settings";

const runsOnServerSide = typeof window === "undefined";

i18next
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string) => import(`./locales/${language}.json`),
    ),
  )
  .use(LanguageDetector)
  .init({
    supportedLngs: languages,
    fallbackLng,
    lng: undefined,
    fallbackNS: "",
    defaultNS: "",
    preload: runsOnServerSide ? languages : [],
    detection: {
      order: ["cookie", "navigator"],
      lookupCookie: storageKey,
    },
  });

export default i18next;
