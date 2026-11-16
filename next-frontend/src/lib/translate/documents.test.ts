import { describe, expect, it } from "vitest";
import { unitsFromDocs } from "./documents";
import type { SourceDoc } from "./documents";
import type { LocalizedField } from "./registry";

const parent: LocalizedField["parent"] = {
  type: "global",
  slug: "home",
  label: "Home",
};

const heading: LocalizedField = {
  parent,
  path: [{ kind: "field", name: "heading", label: "Heading" }],
  pathString: "home.heading",
  widget: "plain",
  required: true,
  description: "Shown above the body.",
};

const body: LocalizedField = {
  parent,
  path: [{ kind: "field", name: "body", label: "Body" }],
  pathString: "home.body",
  widget: "lexical",
  required: true,
  description: "Main text of the page.",
};

const bodySource = {
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          { type: "text", text: "Hello " },
          { type: "text", text: "world", format: 1 },
        ],
      },
    ],
  },
};

const doc: SourceDoc = {
  type: "global",
  slug: "home",
  doc: {},
  leaves: [
    {
      field: heading,
      dataPath: ["heading"],
      baseKey: "home:heading",
      breadcrumb: "Home › Heading",
      source: "Welcome",
    },
    {
      field: body,
      dataPath: ["body"],
      baseKey: "home:body",
      breadcrumb: "Home › Body",
      source: bodySource,
    },
  ],
};

describe("unitsFromDocs", () => {
  const units = unitsFromDocs([doc]);

  it("puts the breadcrumb and field description on a plain unit", () => {
    expect(units["home:heading"]).toEqual({
      message: "Welcome",
      description: "Home › Heading — Shown above the body.",
    });
  });

  it("puts the breadcrumb, field description and tag hint on every rich text block", () => {
    const bodyUnits = Object.entries(units).filter(([key]) =>
      key.startsWith("home:body#"),
    );
    expect(bodyUnits.map(([, unit]) => unit.message)).toEqual([
      "Hello <0>world</0>",
    ]);
    expect(
      bodyUnits.every(([, unit]) =>
        unit.description?.startsWith(
          "Home › Body — Main text of the page. — keep every",
        ),
      ),
    ).toBe(true);
  });
});
