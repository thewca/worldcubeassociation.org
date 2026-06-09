import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import stylistic from "@stylistic/eslint-plugin";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import pluginQuery from "@tanstack/eslint-plugin-query";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  eslintPluginPrettierRecommended,
  ...pluginQuery.configs["flat/recommended"],
  stylistic.configs.recommended,
  eslintConfigPrettier,
  globalIgnores(["src/types"]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@tanstack/query/exhaustive-deps": [
        "error",
        {
          allowlist: {
            variables: ["api"],
            types: ["Client"],
          },
        },
      ],
    },
  },
  {
    // workaround for ESLint 10 per https://github.com/vercel/next.js/issues/89764#issuecomment-3928272828
    settings: {
      react: { version: "19" },
    },
  },
];

export default eslintConfig;
