const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { languages} = require("./src/lib/i18n/settings.ts");

// Recursively flatten a nested object using dot notation
function flattenObject(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, newKey));
    } else {
      acc[newKey] = value;
    }
    return acc;
  }, {});
}

const inputDir = path.resolve(__dirname, '../config/locales/');
const outputDir = path.resolve(__dirname, './src/lib/i18n/locales');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

languages.forEach((lang) => {
  const filePath = path.join(inputDir, `${lang}.yml`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsed = yaml.load(fileContent);

  Object.entries(parsed).forEach(([topLevelKey, content]) => {
    const flattened = flattenObject(content);
    const outputPath = path.join(outputDir, `${topLevelKey}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(flattened, null, 2));
    console.log(`✔ Wrote ${outputPath}`);
  });
});
