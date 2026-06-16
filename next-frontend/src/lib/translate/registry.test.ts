import { describe, expect, it } from "vitest";
import type { Field } from "payload";
import {
  buildTranslationRegistry,
  resolveLeaf,
  resolveStrings,
} from "./registry";

// Mirrors the real shapes in the repo: a blocks field whose block has a
// localized `text` + localized `richText`, a localized field on a collection,
// and an array nested inside a global.
const textCardBlock = {
  slug: "TextCard",
  fields: [
    { name: "heading", type: "text", required: true, localized: true },
    { name: "body", type: "richText", required: true, localized: true },
    { name: "separator", type: "checkbox" }, // not translatable
  ],
} as const;

const source = {
  collections: [
    {
      slug: "tools",
      fields: [
        { name: "name", type: "text", required: true }, // not localized
        { name: "description", type: "text", localized: true },
      ] as Field[],
    },
  ],
  globals: [
    {
      slug: "home",
      fields: [
        {
          name: "blocks",
          type: "blocks",
          blocks: [textCardBlock],
        },
        {
          name: "links",
          type: "array",
          fields: [
            { name: "label", type: "text", localized: true },
            { name: "url", type: "text" },
          ],
        },
      ] as Field[],
    },
  ],
};

describe("buildTranslationRegistry", () => {
  const registry = buildTranslationRegistry(source);

  it("finds exactly the localized free-text fields", () => {
    expect(registry.map((f) => f.pathString).sort()).toEqual([
      "home.blocks(TextCard)[].body",
      "home.blocks(TextCard)[].heading",
      "home.links[].label",
      "tools.description",
    ]);
  });

  it("classifies the editing widget by field type", () => {
    const byPath = Object.fromEntries(registry.map((f) => [f.pathString, f]));
    expect(byPath["home.blocks(TextCard)[].body"].widget).toBe("lexical");
    expect(byPath["home.blocks(TextCard)[].heading"].widget).toBe("plain");
  });

  it("skips non-localized and non-text fields", () => {
    const paths = registry.map((f) => f.pathString);
    expect(paths).not.toContain("tools.name");
    expect(paths).not.toContain("home.links[].url");
  });

  it("throws on an unhandled container type instead of silently dropping it", () => {
    // Simulates a future/custom Payload container type carrying sub-fields:
    // it must fail loudly rather than skip the localized field nested beneath.
    const future = {
      collections: [
        {
          slug: "future",
          fields: [
            {
              name: "section",
              type: "supergroup",
              fields: [{ name: "title", type: "text", localized: true }],
            },
          ] as unknown as Field[],
        },
      ],
      globals: [],
    };
    expect(() => buildTranslationRegistry(future)).toThrow(
      /unhandled container/,
    );
  });
});

describe("resolveStrings", () => {
  const registry = buildTranslationRegistry(source);
  const byPath = Object.fromEntries(registry.map((f) => [f.pathString, f]));

  it("expands a block field across instances with concrete data paths", () => {
    const doc = {
      blocks: [
        { id: "a1", blockType: "TextCard", heading: "Welcome", body: {} },
        { id: "a2", blockType: "TextCard", heading: "Goodbye", body: {} },
      ],
    };
    const strings = resolveStrings(
      byPath["home.blocks(TextCard)[].heading"],
      doc,
    );

    expect(strings.map((s) => s.dataPath)).toEqual([
      ["blocks", 0, "heading"],
      ["blocks", 1, "heading"],
    ]);
    expect(strings.map((s) => s.value)).toEqual(["Welcome", "Goodbye"]);
    // Keys use the row id, so they survive reordering.
    expect(strings.map((s) => s.key)).toEqual([
      "home:blocks[a1].heading",
      "home:blocks[a2].heading",
    ]);
  });

  it("ignores blocks of a different type in the same array", () => {
    const doc = {
      blocks: [
        { id: "x", blockType: "ImageCard", caption: "nope" },
        { id: "y", blockType: "TextCard", heading: "yes", body: {} },
      ],
    };
    const strings = resolveStrings(
      byPath["home.blocks(TextCard)[].heading"],
      doc,
    );
    expect(strings).toHaveLength(1);
    expect(strings[0].value).toBe("yes");
  });

  it("returns null for a missing leaf value", () => {
    const strings = resolveStrings(byPath["tools.description"], {});
    expect(strings).toEqual([
      expect.objectContaining({ dataPath: ["description"], value: null }),
    ]);
  });
});

describe("resolveLeaf (write-side guard)", () => {
  const registry = buildTranslationRegistry(source);
  const byPath = Object.fromEntries(registry.map((f) => [f.pathString, f]));

  it("resolves a block leaf to its container + key for mutation", () => {
    const doc = {
      blocks: [{ id: "a1", blockType: "TextCard", heading: "Hi", body: {} }],
    };
    const leaf = resolveLeaf(doc, byPath["home.blocks(TextCard)[].heading"], [
      "blocks",
      0,
      "heading",
    ]);
    expect(leaf?.key).toBe("heading");
    expect(leaf?.container).toBe(doc.blocks[0]);
    // The returned container is live, so writing through it mutates the doc.
    leaf!.container[leaf!.key] = "Hallo";
    expect(doc.blocks[0].heading).toBe("Hallo");
  });

  it("rejects a path that lands on the wrong block type", () => {
    const doc = { blocks: [{ id: "x", blockType: "ImageCard" }] };
    const leaf = resolveLeaf(doc, byPath["home.blocks(TextCard)[].heading"], [
      "blocks",
      0,
      "heading",
    ]);
    expect(leaf).toBeNull();
  });

  it("rejects a structurally mismatched path", () => {
    const doc = {
      blocks: [{ id: "a1", blockType: "TextCard", heading: "Hi" }],
    };
    // Missing the array index.
    expect(
      resolveLeaf(doc, byPath["home.blocks(TextCard)[].heading"], [
        "blocks",
        "heading",
      ]),
    ).toBeNull();
    // Out-of-range row.
    expect(
      resolveLeaf(doc, byPath["home.blocks(TextCard)[].heading"], [
        "blocks",
        5,
        "heading",
      ]),
    ).toBeNull();
  });

  it("resolves a plain top-level leaf", () => {
    const doc = { description: "old" };
    const leaf = resolveLeaf(doc, byPath["tools.description"], ["description"]);
    expect(leaf).toEqual({ container: doc, key: "description" });
  });
});
