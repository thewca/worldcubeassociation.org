import { describe, expect, it } from "vitest";
import { applyLexicalTexts, lexicalTextNodes } from "./lexical";

/**
 * These cover the contract that removes the need for a rich text editor:
 * translators only ever see and edit plain text, and the document structure on
 * write-back comes from Payload's own source value rather than being authored
 * by us.
 */

interface TestNode {
  type: string;
  version?: number;
  children?: TestNode[];
  [key: string]: unknown;
}

// A paragraph with a bold run and a link, plus a node type this code has never
// heard of, standing in for whatever a future Payload/Lexical version adds.
const source: { root: TestNode } = {
  root: {
    type: "root",
    version: 1,
    children: [
      {
        type: "paragraph",
        version: 1,
        children: [
          { type: "text", version: 1, format: 0, text: "Hello " },
          { type: "text", version: 1, format: 1, text: "world" },
        ],
      },
      {
        type: "some-future-block",
        version: 3,
        customProp: { deeply: ["nested", 1, true] },
        children: [
          {
            type: "link",
            version: 1,
            fields: { url: "https://example.com" },
            children: [{ type: "text", version: 1, format: 0, text: "a link" }],
          },
        ],
      },
      { type: "horizontalrule", version: 1 },
    ],
  },
};

describe("lexicalTextNodes", () => {
  it("extracts every text node with its index path", () => {
    expect(lexicalTextNodes(source)).toEqual([
      { path: "0.0", text: "Hello " },
      { path: "0.1", text: "world" },
      { path: "1.0.0", text: "a link" },
    ]);
  });

  it("descends into unknown node types rather than stopping at them", () => {
    // "a link" lives under `some-future-block`; missing it would silently drop
    // strings whenever Payload adds a node type.
    expect(lexicalTextNodes(source).map((n) => n.text)).toContain("a link");
  });

  it("skips blank text nodes so Weblate gets no empty units", () => {
    const withBlank = {
      root: {
        children: [
          { type: "paragraph", children: [{ type: "text", text: "   " }] },
          { type: "paragraph", children: [{ type: "text", text: "real" }] },
        ],
      },
    };
    expect(lexicalTextNodes(withBlank)).toEqual([
      { path: "1.0", text: "real" },
    ]);
  });

  it("returns nothing for null or non-Lexical values", () => {
    expect(lexicalTextNodes(null)).toEqual([]);
    expect(lexicalTextNodes("a plain string")).toEqual([]);
    expect(lexicalTextNodes({})).toEqual([]);
  });
});

describe("applyLexicalTexts", () => {
  const translations = new Map([
    ["0.0", "Hallo "],
    ["0.1", "Welt"],
    ["1.0.0", "ein Link"],
  ]);

  it("substitutes text without disturbing structure", () => {
    const result = applyLexicalTexts(source, translations) as typeof source;
    expect(lexicalTextNodes(result)).toEqual([
      { path: "0.0", text: "Hallo " },
      { path: "0.1", text: "Welt" },
      { path: "1.0.0", text: "ein Link" },
    ]);
  });

  it("preserves formatting, versions and unknown node properties", () => {
    const result = applyLexicalTexts(source, translations) as typeof source;
    const [paragraph, future, rule] = result.root.children!;

    // The bold run stays bold, and the link keeps its href.
    expect(paragraph.children![1].format).toBe(1);
    expect(future.children![0].fields).toEqual({ url: "https://example.com" });
    // The node type we do not understand survives untouched, which is the whole
    // reason structure is cloned from the source rather than rebuilt.
    expect(future.type).toBe("some-future-block");
    expect(future.customProp).toEqual({ deeply: ["nested", 1, true] });
    expect(rule).toEqual({ type: "horizontalrule", version: 1 });
    expect(result.root.version).toBe(1);
  });

  it("leaves nodes alone when no translation is supplied", () => {
    const partial = applyLexicalTexts(
      source,
      new Map([["0.0", "Hallo "]]),
    ) as typeof source;
    expect(lexicalTextNodes(partial)).toEqual([
      { path: "0.0", text: "Hallo " },
      { path: "0.1", text: "world" },
      { path: "1.0.0", text: "a link" },
    ]);
  });

  it("does not mutate the source value", () => {
    const before = JSON.stringify(source);
    applyLexicalTexts(source, translations);
    expect(JSON.stringify(source)).toBe(before);
  });

  it("round-trips: extract, translate each unit, apply", () => {
    const units = lexicalTextNodes(source);
    const translated = new Map(
      units.map((u) => [u.path, `[de] ${u.text}`] as const),
    );
    const result = applyLexicalTexts(source, translated);
    expect(lexicalTextNodes(result)).toEqual(
      units.map((u) => ({ path: u.path, text: `[de] ${u.text}` })),
    );
  });
});
