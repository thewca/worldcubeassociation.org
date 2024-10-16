import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import react from "eslint-plugin-react";
import jquery from "eslint-plugin-jquery";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [...fixupConfigRules(
  compat.extends("plugin:react/recommended", "plugin:react-hooks/recommended", "airbnb"),
), {
  plugins: {
    react: fixupPluginRules(react),
    jquery,
  },

  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.jquery,
      Atomics: "readonly",
      SharedArrayBuffer: "readonly",
      _: true,
      moment: true,
    },

    ecmaVersion: 14,
    sourceType: "module",

    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },

  rules: {
    "react/prop-types": "off",
    "react/jsx-filename-extension": "off",

    "import/no-unresolved": ["error", {
      ignore: ["semantic-css/"],
    }],

    "no-console": ["error", {
      allow: ["warn", "error"],
    }],
  },
}];
