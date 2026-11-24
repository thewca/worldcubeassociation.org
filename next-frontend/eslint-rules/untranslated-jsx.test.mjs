import { resolve } from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ cwd: resolve(import.meta.dirname, "..") });

async function translationErrors(
  code,
  filePath = "src/TranslationExample.tsx",
) {
  const [result] = await eslint.lintText(code, { filePath });
  expect(result.fatalErrorCount).toBe(0);
  return result.messages.filter(
    (message) => message.ruleId === "no-restricted-syntax",
  );
}

describe("JSX translation lint", () => {
  it.each([
    ["JSX text", "<Heading>Upcoming competitions</Heading>"],
    ["an accessibility label", '<IconButton aria-label="Close" />'],
    ["a placeholder expression", '<Input placeholder={"大会を検索"} />'],
  ])("reports hard-coded copy in %s as an error", async (_label, code) => {
    expect(await translationErrors(code)).toMatchObject([
      { severity: 2, message: "Translate this JSX text with i18next." },
    ]);
  });

  it("reports copy in both branches of an inline conditional", async () => {
    const code =
      '<Text>{status === "open" ? `Register for ${name}` : "Registration closed"}</Text>';
    expect(await translationErrors(code)).toHaveLength(2);
  });

  it("allows translations, dynamic content, and technical props", async () => {
    const code =
      '<Link href="/competitions" variant="underline" aria-label={t("competitions.view")}>{status === "open" ? t("competitions.register") : name} · <img src="/logo.svg" alt="" /></Link>';
    expect(await translationErrors(code)).toEqual([]);
  });

  it("allows literal copy in TSX test fixtures", async () => {
    expect(
      await translationErrors(
        "<Heading>Upcoming competitions</Heading>",
        "src/TranslationExample.test.tsx",
      ),
    ).toEqual([]);
  });
});
