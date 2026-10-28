import { describe, expect, it } from "vitest";
import { applyLexicalTexts, lexicalUnits } from "./lexical";

/**
 * These cover the contract that removes the need for a rich text editor:
 * translators only ever see and edit sentences with numbered placeholders, and
 * the document structure on write-back comes from Payload's own source value
 * rather than being authored by us.
 */

interface TestNode {
  type: string;
  version?: number;
  children?: TestNode[];
  [key: string]: unknown;
}

const text = (value: string, format = 0): TestNode => ({
  type: "text",
  version: 1,
  format,
  style: "",
  text: value,
});

const link: TestNode = {
  type: "link",
  version: 1,
  fields: { url: "https://example.com" },
  children: [text("our website")],
};

// A paragraph with a bold run, a link, a trailing period and a line break, plus
// a node type this code has never heard of, standing in for whatever a future
// Payload/Lexical version adds.
const source: { root: TestNode } = {
  root: {
    type: "root",
    version: 1,
    children: [
      {
        type: "paragraph",
        version: 1,
        children: [
          text("Hello "),
          text("world", 1),
          text(", see "),
          link,
          text("."),
          { type: "linebreak", version: 1 },
        ],
      },
      {
        type: "some-future-block",
        version: 3,
        customProp: { deeply: ["nested", 1, true] },
        children: [{ type: "heading", version: 1, children: [text("Title")] }],
      },
      { type: "horizontalrule", version: 1 },
    ],
  },
};

type Root = typeof source;
const children = (result: unknown, i: number) =>
  (result as Root).root.children![i].children!;

describe("lexicalUnits", () => {
  it("makes one unit per block, with inline nodes as placeholders", () => {
    expect(
      lexicalUnits(source).map(({ path, text }) => ({ path, text })),
    ).toEqual([
      { path: "0", text: "Hello <0>world</0>, see <1>our website</1>.<2/>" },
      { path: "1.0", text: "Title" },
    ]);
  });

  it("skips blocks without real text so Weblate gets no empty units", () => {
    const blank = {
      root: {
        children: [
          { type: "paragraph", children: [text("   ")] },
          {
            type: "paragraph",
            children: [text(" "), { type: "linebreak" }],
          },
          { type: "paragraph", children: [text("real")] },
        ],
      },
    };
    expect(lexicalUnits(blank).map((u) => u.path)).toEqual(["2"]);
  });

  it("gives blocks differing only in text the same shape", () => {
    const [paragraph] = lexicalUnits(source);
    const translated = applyLexicalTexts(
      source,
      new Map([["0", "Hallo <0>Welt</0>, siehe <1>unsere Seite</1>.<2/>"]]),
    );
    const reordered = applyLexicalTexts(
      source,
      new Map([["0", "<1>Unsere Seite</1>: hallo <0>Welt</0>.<2/>"]]),
    );
    expect(lexicalUnits(translated)[0].shape).toBe(paragraph.shape);
    expect(lexicalUnits(reordered)[0].shape).not.toBe(paragraph.shape);
  });

  it("returns nothing for null or non-Lexical values", () => {
    expect(lexicalUnits(null)).toEqual([]);
    expect(lexicalUnits("a plain string")).toEqual([]);
    expect(lexicalUnits({})).toEqual([]);
  });
});

describe("applyLexicalTexts", () => {
  const translations = new Map([
    ["0", "<1>Unsere Seite</1> und <0>Welt</0>, hallo.<2/>"],
    ["1.0", "Titel"],
  ]);

  it("rebuilds blocks in translated order from the source's own nodes", () => {
    const result = applyLexicalTexts(source, translations);
    expect(children(result, 0)).toEqual([
      { ...link, children: [text("Unsere Seite")] },
      text(" und "),
      text("Welt", 1),
      text(", hallo."),
      { type: "linebreak", version: 1 },
    ]);
  });

  it("preserves versions and unknown node properties", () => {
    const result = applyLexicalTexts(source, translations) as Root;
    const [, future, rule] = result.root.children!;
    expect(future.type).toBe("some-future-block");
    expect(future.customProp).toEqual({ deeply: ["nested", 1, true] });
    expect(future.children![0].children).toEqual([text("Titel")]);
    expect(rule).toEqual({ type: "horizontalrule", version: 1 });
    expect(result.root.version).toBe(1);
  });

  it("leaves blocks alone when no translation is supplied", () => {
    const partial = applyLexicalTexts(source, new Map([["1.0", "Titel"]]));
    expect(children(partial, 0)).toEqual(source.root.children![0].children);
  });

  it.each([
    ["a missing placeholder", "Hallo <0>Welt</0>.<2/>"],
    ["a duplicated placeholder", "<0>a</0> <0>b</0> <1>c</1><2/>"],
    ["an unknown placeholder", "<0>a</0> <1>b</1><2/><3/>"],
    ["an unclosed tag", "<0>a <1>b</1><2/>"],
    ["mismatched tags", "<0>a <1>b</0></1><2/>"],
    ["a void node written as a pair", "<0>a</0> <1>b</1><2>x</2>"],
    ["a link written as void", "<0>a</0> <1/><2/>"],
    ["a tag nested in a text run", "<0>a <2/></0> <1>b</1>"],
  ])("rejects a translation with %s", (_, broken) => {
    expect(applyLexicalTexts(source, new Map([["0", broken]]))).toBeUndefined();
  });

  it("does not mutate the source value", () => {
    const before = JSON.stringify(source);
    applyLexicalTexts(source, translations);
    expect(JSON.stringify(source)).toBe(before);
  });

  it("round-trips: extract, apply unchanged, extract again", () => {
    const units = lexicalUnits(source);
    const result = applyLexicalTexts(
      source,
      new Map(units.map((u) => [u.path, u.text])),
    );
    expect(result).toEqual(source);
  });
});
