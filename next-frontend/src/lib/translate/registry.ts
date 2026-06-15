import type { Field } from "payload";

/**
 * Config-introspection registry for the community translator tool.
 *
 * `buildTranslationRegistry` walks the Payload config and returns a flat list of
 * every `localized: true` field (the "schema" of what can be translated).
 * `resolveStrings` then expands one schema descriptor against an actual document
 * into concrete, addressable strings (arrays/blocks get real indices).
 *
 * Together these are the Payload equivalent of internationalize walking the YAML
 * tree: the registry gives you the denominator for a progress bar, and the
 * resolver gives you the individual strings to render and write back.
 */

/** A single step in the path from a document root to a localized leaf field. */
export type PathSegment =
  // Object nesting: a named field, named group, or named tab.
  | { kind: "field"; name: string }
  // Repeatable array field — expands to one entry per row at resolve time.
  | { kind: "array"; name: string }
  // Blocks field — expands to one entry per matching block instance.
  | { kind: "block"; name: string; blockSlug: string };

/** How a translator should edit this field. */
export type Widget = "plain" | "lexical";

/** A localized field as it exists in the schema (not tied to any document). */
export interface LocalizedField {
  parent: { type: "collection" | "global"; slug: string };
  /** Path from the document root down to (and including) the leaf field. */
  path: PathSegment[];
  /** Stable, human-readable id, e.g. `home.blocks(TextCard)[].body`. */
  pathString: string;
  /** Raw Payload field type, e.g. "text" | "textarea" | "richText". */
  fieldType: "text" | "textarea" | "richText";
  widget: Widget;
  label: string;
  /** True when localization is inherited from a localized ancestor container. */
  inheritedLocalization: boolean;
}

/** A concrete translatable string, resolved against a specific document. */
export interface TranslatableString {
  field: LocalizedField;
  /** Concrete data path including array/block indices, e.g. ["blocks", 0, "body"]. */
  dataPath: (string | number)[];
  /** Stable key for this exact string (uses block/array `id` when present). */
  key: string;
  value: unknown;
}

type RegistrySource = {
  collections: { slug: string; fields: Field[] }[];
  globals: { slug: string; fields: Field[] }[];
};

const TRANSLATABLE_TYPES = new Set(["text", "textarea", "richText"]);

function labelOf(field: Extract<Field, { name: string }>): string {
  const { label } = field;
  if (typeof label === "string") return label;
  return field.name;
}

function segmentToString(seg: PathSegment): string {
  switch (seg.kind) {
    case "field":
      return seg.name;
    case "array":
      return `${seg.name}[]`;
    case "block":
      return `${seg.name}(${seg.blockSlug})[]`;
  }
}

function walk(
  fields: Field[],
  parent: LocalizedField["parent"],
  basePath: PathSegment[],
  inherited: boolean,
  out: LocalizedField[],
): void {
  for (const field of fields) {
    switch (field.type) {
      // Presentational containers: no data path segment, descend in place.
      case "row":
      case "collapsible":
        walk(field.fields, parent, basePath, inherited, out);
        break;

      case "tabs":
        for (const tab of field.tabs) {
          const named = "name" in tab && tab.name;
          walk(
            tab.fields,
            parent,
            named ? [...basePath, { kind: "field", name: tab.name }] : basePath,
            inherited,
            out,
          );
        }
        break;

      case "group":
        if (!("name" in field)) {
          // Unnamed group: behaves like a presentational container.
          walk(field.fields, parent, basePath, inherited, out);
          break;
        }
        walk(
          field.fields,
          parent,
          [...basePath, { kind: "field", name: field.name }],
          inherited || !!field.localized,
          out,
        );
        break;

      case "array":
        walk(
          field.fields,
          parent,
          [...basePath, { kind: "array", name: field.name }],
          inherited || !!field.localized,
          out,
        );
        break;

      case "blocks":
        for (const block of field.blocks) {
          walk(
            block.fields,
            parent,
            [
              ...basePath,
              { kind: "block", name: field.name, blockSlug: block.slug },
            ],
            inherited || !!field.localized,
            out,
          );
        }
        break;

      case "text":
      case "textarea":
      case "richText":
        if (field.localized || inherited) {
          const path: PathSegment[] = [
            ...basePath,
            { kind: "field", name: field.name },
          ];
          out.push({
            parent,
            path,
            pathString: `${parent.slug}.${path.map(segmentToString).join(".")}`,
            fieldType: field.type,
            widget: field.type === "richText" ? "lexical" : "plain",
            label: labelOf(field),
            inheritedLocalization: !field.localized && inherited,
          });
        }
        break;

      // Everything else (number, checkbox, select, upload, relationship, ...)
      // is not free-text and is intentionally skipped.
      default:
        break;
    }
  }
}

/**
 * Walk all collections and globals, returning every localized free-text field.
 * Pass `payload.config` (a SanitizedConfig) at runtime.
 */
export function buildTranslationRegistry(
  config: RegistrySource,
): LocalizedField[] {
  const out: LocalizedField[] = [];
  for (const collection of config.collections) {
    walk(
      collection.fields,
      { type: "collection", slug: collection.slug },
      [],
      false,
      out,
    );
  }
  for (const global of config.globals) {
    walk(global.fields, { type: "global", slug: global.slug }, [], false, out);
  }
  return out;
}

/**
 * Expand one schema descriptor against a fetched document into concrete strings.
 * `doc` should be a single document/global fetched at one locale.
 */
export function resolveStrings(
  field: LocalizedField,
  doc: Record<string, unknown>,
): TranslatableString[] {
  const out: TranslatableString[] = [];

  const recurse = (
    segs: PathSegment[],
    node: unknown,
    dataPath: (string | number)[],
    keyParts: string[],
  ): void => {
    if (node == null || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const [seg, ...rest] = segs;

    if (seg.kind === "field") {
      if (rest.length === 0) {
        out.push({
          field,
          dataPath: [...dataPath, seg.name],
          key: `${field.parent.slug}:${[...keyParts, seg.name].join(".")}`,
          value: record[seg.name] ?? null,
        });
      } else {
        recurse(
          rest,
          record[seg.name],
          [...dataPath, seg.name],
          [...keyParts, seg.name],
        );
      }
      return;
    }

    // array | block: iterate rows, preferring a stable `id` for the key.
    const rows = record[seg.name];
    if (!Array.isArray(rows)) return;
    rows.forEach((row, index) => {
      if (
        seg.kind === "block" &&
        (row as Record<string, unknown>)?.blockType !== seg.blockSlug
      ) {
        return;
      }
      const id = (row as Record<string, unknown>)?.id;
      const keyPart = `${seg.name}[${id ?? index}]`;
      recurse(
        rest,
        row,
        [...dataPath, seg.name, index],
        [...keyParts, keyPart],
      );
    });
  };

  recurse(field.path, doc, [], []);
  return out;
}
