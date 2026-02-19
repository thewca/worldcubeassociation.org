import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";
import {
  fallbackLng,
  languages,
  storageKey,
  defaultNamespace,
} from "./settings";

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
    defaultNS: defaultNamespace,
    preload: runsOnServerSide ? languages : [],
    keySeparator: false,
    interpolation: {
      prefix: "%{",
      suffix: "}",
      escapeValue: false,
    },
    // Little hack: Normally, i18next marks plurals with a separate symbol, like so:
    //   some.nested.key_one: "One nested key"
    //   some.nested.key_other: "Many nested keys"
    // This is a good idea in principle, but our hand-written transformation would need to
    // detect which key suffixes in the YAML nesting are plural keys, and which aren't.
    // This isn't exactly hard to program but can be hard to maintain (and cover all edge cases)
    // so for now we pretend that plurals are demarcated just as normal nesting items.
    pluralSeparator: ".",
    detection: {
      order: ["cookie", "navigator"],
      lookupCookie: storageKey,
    },
  });

export default i18next;
