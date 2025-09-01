#!/usr/bin/env node

/* eslint @typescript-eslint/no-require-imports: 0 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const languages = Object.keys(require("./src/lib/i18n/locales/available.json"));
const countries = require("i18n-iso-countries");

// Recursively flatten a nested object using dot notation
function flattenObject(obj, prefix = "") {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, newKey));
    } else {
      acc[newKey] = value;
    }
    return acc;
  }, {});
}

// Add Country Names if not translated already
function addCountryNames(translation, lang) {
  const supportedLanguages = countries.getSupportedLanguages();
  if (supportedLanguages.indexOf(lang) === -1) {
    return translation;
  }
  const languageCode = lang.slice(0, 2);
  const codes = Object.keys(countries.getAlpha2Codes());
  countries.registerLocale(
    require(`i18n-iso-countries/langs/${languageCode}.json`),
  );
  codes.forEach((code) => {
    const languageKey = `countries.${code}`;
    if (!translation[languageKey]) {
      translation[languageKey] = countries.getName(code, languageCode);
    }
  });
  return translation;
}

const localeDir = process.env.LOCALE_DIR || "../config/locales/";

const inputDir = path.resolve(__dirname, localeDir);
const outputDir = path.resolve(__dirname, "./src/lib/i18n/locales");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

languages.forEach((lang) => {
  const filePath = path.join(inputDir, `${lang}.yml`);
  const fileContent = fs.readFileSync(filePath, "utf8");
  const parsed = yaml.load(fileContent);

  Object.entries(parsed).forEach(([topLevelKey, content]) => {
    const flattened = flattenObject(content);
    const withCountries = addCountryNames(flattened, lang);
    const outputPath = path.join(outputDir, `${topLevelKey}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(withCountries, null, 2));
    console.log(`✔ Wrote ${outputPath}`);
  });
});
