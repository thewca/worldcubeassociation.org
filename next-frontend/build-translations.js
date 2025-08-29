#!/usr/bin/env node

/* eslint @typescript-eslint/no-require-imports: 0 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const languages = Object.keys(require("./src/lib/i18n/locales/available.json"));

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
    const outputPath = path.join(outputDir, `${topLevelKey}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(flattened, null, 2));
    console.log(`✔ Wrote ${outputPath}`);
  });
});
