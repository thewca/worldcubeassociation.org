import { RuleTester } from "eslint";
import parser from "@typescript-eslint/parser";
import { describe, it } from "vitest";
import rule from "./prefer-logical-properties.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
});
const error = (name, replacement) => ({
  messageId: "preferLogical",
  data: { name, replacement },
});
const withBoxImport = (code) =>
  `import { Box } from "@chakra-ui/react";\n${code}`;

tester.run("prefer-logical-properties", rule, {
  valid: [
    // Already uses logical props.
    withBoxImport(
      '<Box ms={2} marginInlineEnd="auto" ps={4} paddingEnd={3} textAlign="center" />',
    ),
    // Ignores objects that aren't used as css.
    withBoxImport(
      'const data = { pr: 1, left: 2 }; const side = "left"; <Box textAlign={side}>{data.pr}</Box>',
    ),
    // Allows explicit lint exceptions.
    withBoxImport(
      "<Box ml={2} /> // eslint-disable-line rule-to-test/prefer-logical-properties -- Physical image coordinates",
    ),
    // Ignores unrelated components and helpers.
    'import { Box, defineStyle } from "another-library"; const styles = { mr: 2 }; defineStyle({ pl: 1 }); <Box ml={0.5} css={{ pl: 2 }} _hover={{ pr: 3 }} {...styles} />',
    // Ignores objects shared with unrelated components.
    withBoxImport(
      'const shared = { ml: 2, textAlign: "right" }; <><Box css={shared} /><Model {...shared} /></>',
    ),
    // Ignores local components that shadow Chakra imports.
    withBoxImport(
      "function Example(Box) { return <Box ml={1} css={{ pr: 2 }} />; }",
    ),
  ],
  invalid: [
    // Fixes spacing props without changing values.
    {
      code: withBoxImport(
        '<><Box ml={{ base: 1, md: 2 }} mr="auto" pl={3} pr={4} /><Box marginLeft={1} marginRight={2} paddingLeft={3} paddingRight={4} /></>',
      ),
      output: withBoxImport(
        '<><Box ms={{ base: 1, md: 2 }} me="auto" ps={3} pe={4} /><Box marginStart={1} marginEnd={2} paddingStart={3} paddingEnd={4} /></>',
      ),
      errors: [
        error("ml", "ms"),
        error("mr", "me"),
        error("pl", "ps"),
        error("pr", "pe"),
        error("marginLeft", "marginStart"),
        error("marginRight", "marginEnd"),
        error("paddingLeft", "paddingStart"),
        error("paddingRight", "paddingEnd"),
      ],
    },
    // Fixes positioning, borders, and alignment.
    {
      code: withBoxImport(
        '<Box left={0} right={0} borderLeft="1px" borderRight="1px" textAlign="right" />',
      ),
      output: withBoxImport(
        '<Box insetStart={0} insetEnd={0} borderStart="1px" borderEnd="1px" textAlign="end" />',
      ),
      errors: [
        error("left", "insetStart"),
        error("right", "insetEnd"),
        error("borderLeft", "borderStart"),
        error("borderRight", "borderEnd"),
        error("right", "end"),
      ],
    },
    // Follows aliased, namespace, and compound imports.
    {
      code: 'import { Table as Results } from "@chakra-ui/react"; import * as UI from "@chakra-ui/react"; <><Results.Cell ml={2} /><UI.Box pr={3} /></>',
      output:
        'import { Table as Results } from "@chakra-ui/react"; import * as UI from "@chakra-ui/react"; <><Results.Cell ms={2} /><UI.Box pe={3} /></>',
      errors: [error("ml", "ms"), error("pr", "pe")],
    },
    // Fixes responsive alignment and hover styles.
    {
      code: withBoxImport(
        `<Box textAlign={{ base: 'left', md: 'right' }} _hover={{ pl: 2 }} />`,
      ),
      output: withBoxImport(
        `<Box textAlign={{ base: 'start', md: 'end' }} _hover={{ ps: 2 }} />`,
      ),
      errors: [
        error("left", "start"),
        error("right", "end"),
        error("pl", "ps"),
      ],
    },
    // Follows const style objects and nested selectors.
    {
      code: withBoxImport(
        `const styles = { "& ul": { pl: 6 }, "& .label": { 'mr': 1 } } as const; <Box css={styles} />`,
      ),
      output: withBoxImport(
        `const styles = { "& ul": { ps: 6 }, "& .label": { 'me': 1 } } as const; <Box css={styles} />`,
      ),
      errors: [error("pl", "ps"), error("mr", "me")],
    },
    // Checks style helper calls.
    {
      code: 'import { defineStyle as style } from "@chakra-ui/react"; style({ pl: 2, textAlign: "right" });',
      output:
        'import { defineStyle as style } from "@chakra-ui/react"; style({ ps: 2, textAlign: "end" });',
      errors: [error("pl", "ps"), error("right", "end")],
    },
    // Reports conflicting props.
    {
      code: withBoxImport(
        "<><Box ml={2} marginInlineStart={4} /><Box css={{ pl: 2, paddingStart: 4 }} /></>",
      ),
      output: null,
      errors: [error("ml", "ms"), error("pl", "ps")],
    },
    // Reports spread declarations.
    {
      code: withBoxImport(
        "const styles = { ml: 2 }; <Box {...styles} ms={4} pr={2} />",
      ),
      output: null,
      errors: [error("ml", "ms"), error("pr", "pe")],
    },
  ],
});
