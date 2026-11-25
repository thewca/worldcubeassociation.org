import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import stylistic from "@stylistic/eslint-plugin";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import pluginQuery from "@tanstack/eslint-plugin-query";
import preferLogicalProperties from "./eslint-rules/prefer-logical-properties.mjs";
import noAuthInUseCache from "./eslint-rules/no-auth-in-use-cache.mjs";

const UNTRANSLATED_JSX_SELECTOR = (() => {
  // Match copy in JSX, including inline branches, without matching identifiers
  // such as routes, design tokens, or translation keys passed into t().
  const containsLetter = String.raw`/\p{L}/u`;
  const jsxContent =
    ":matches(JSXElement:not([openingElement.name.name=/^(script|style)$/]), JSXFragment)";
  const textProp =
    "JSXAttribute[name.name=/^(alt|aria-(braillelabel|brailleroledescription|description|label|placeholder|roledescription|valuetext)|buttonText|children|description|heading|label|placeholder|title)$/]";
  const jsxExpression = `:matches(${jsxContent}, ${textProp}) > JSXExpressionContainer`;
  const textExpression = `:matches(Literal[value=${containsLetter}], TemplateLiteral:has(> TemplateElement[value.cooked=${containsLetter}]))`;

  return [
    `${jsxContent} > JSXText[value=${containsLetter}]`,
    `${textProp} > Literal[value=${containsLetter}]`,
    `${jsxExpression} > ${textExpression}`,
    `${jsxExpression} > ConditionalExpression > :matches(.consequent, .alternate)${textExpression}`,
    `${jsxExpression} > LogicalExpression > .right${textExpression}`,
    `${jsxExpression} > LogicalExpression:not([operator='&&']) > .left${textExpression}`,
    `${jsxExpression} > BinaryExpression[operator='+'] > ${textExpression}`,
  ].join(", ");
})();

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "public/**",
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
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      wca: {
        rules: {
          "prefer-logical-properties": preferLogicalProperties,
          "no-auth-in-use-cache": noAuthInUseCache,
        },
      },
    },
    rules: {
      "wca/prefer-logical-properties": "error",
      "wca/no-auth-in-use-cache": "error",
    },
  },
  {
    files: ["src/**/*.tsx"],
    ignores: ["**/*.{test,spec}.tsx", "**/__tests__/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: UNTRANSLATED_JSX_SELECTOR,
          message: "Translate this JSX text with i18next.",
        },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@stylistic/list-style": "off",
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
