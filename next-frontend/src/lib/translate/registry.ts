import {
  flattenAllFields,
  type Field,
  type FlattenedBlock,
  type FlattenedField,
} from "payload";
import { fieldShouldBeLocalized } from "payload/shared";

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
 *
 * The schema walk leans on Payload's own utilities so it tracks Payload's
 * semantics for free: `flattenAllFields` normalizes the field tree (collapsing
 * `row`/`collapsible`/unnamed `tabs`/unnamed `group`, dropping `ui` fields, and
 * resolving block references) and `fieldShouldBeLocalized` decides localization
 * (including the "no localized-within-localized" inheritance rule).
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

/**
 * Recurse over Payload's *flattened* field tree, emitting one `LocalizedField`
 * per localized free-text leaf. Because the tree is already flattened, the only
 * containers left are named ones (`group`/`tab`/`array`/`blocks`) — presentational
 * wrappers and `ui` fields have been stripped by `flattenAllFields`.
 *
 * `parentIsLocalized` carries Payload's inheritance: when an ancestor container
 * is localized, the whole subtree is stored per-locale, so leaves are
 * translatable even without their own `localized: true`.
 */
function walk(
  fields: FlattenedField[],
  parent: LocalizedField["parent"],
  basePath: PathSegment[],
  parentIsLocalized: boolean,
  out: LocalizedField[],
): void {
  for (const field of fields) {
    switch (field.type) {
      // Named object containers (unnamed ones were collapsed by flattening).
      case "group":
      case "tab":
        walk(
          field.flattenedFields,
          parent,
          [...basePath, { kind: "field", name: field.name }],
          parentIsLocalized ||
            fieldShouldBeLocalized({ field, parentIsLocalized }),
          out,
        );
        break;

      case "array":
        walk(
          field.flattenedFields,
          parent,
          [...basePath, { kind: "array", name: field.name }],
          parentIsLocalized ||
            fieldShouldBeLocalized({ field, parentIsLocalized }),
          out,
        );
        break;

      case "blocks": {
        const childIsLocalized =
          parentIsLocalized ||
          // FlattenedBlocksField narrows `blocks` to FlattenedBlock[], so it
          // isn't structurally a Field; the helper only reads `.localized`.
          fieldShouldBeLocalized({ field: field as Field, parentIsLocalized });
        // flattenAllFields resolves inline blocks and object references to
        // FlattenedBlock; bare string references (defined in `config.blocks`)
        // can't be resolved without the config and are skipped.
        const blocks = (field.blockReferences ?? field.blocks).filter(
          (block): block is FlattenedBlock => typeof block !== "string",
        );
        for (const block of blocks) {
          walk(
            block.flattenedFields,
            parent,
            [
              ...basePath,
              { kind: "block", name: field.name, blockSlug: block.slug },
            ],
            childIsLocalized,
            out,
          );
        }
        break;
      }

      case "text":
      case "textarea":
      case "richText": {
        const isLocalized = fieldShouldBeLocalized({
          field,
          parentIsLocalized,
        });
        if (isLocalized || parentIsLocalized) {
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
            inheritedLocalization: !field.localized && parentIsLocalized,
          });
        }
        break;
      }

      // Everything else (number, checkbox, select, upload, relationship, ...)
      // is a non-text leaf and is intentionally skipped — even when localized.
      default:
        // ...unless it carries sub-fields. Then it's a container that
        // flattenAllFields produced but this walk doesn't descend (a new Payload
        // field type, or a custom one). Fail loudly instead of silently dropping
        // every localized string nested beneath it; this trips in tests on a
        // Payload upgrade, before it reaches users.
        if (
          "fields" in field ||
          "flattenedFields" in field ||
          "blocks" in field ||
          "tabs" in field
        ) {
          throw new Error(
            `translate/registry: unhandled container field type "${field.type}"; ` +
              `nested localized fields would be silently missed. Add a case to walk().`,
          );
        }
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
      flattenAllFields({ fields: collection.fields }),
      { type: "collection", slug: collection.slug },
      [],
      false,
      out,
    );
  }
  for (const global of config.globals) {
    walk(
      flattenAllFields({ fields: global.fields }),
      { type: "global", slug: global.slug },
      [],
      false,
      out,
    );
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

/**
 * Walk a field's schema path alongside a concrete `dataPath` (verifying block
 * types) and return the leaf's container object + key, or null if the data path
 * does not resolve to this field's localized leaf.
 *
 * This is the write-side guard: it proves a requested write target is a known
 * localized field before any mutation happens.
 */
export function resolveLeaf(
  doc: Record<string, unknown>,
  field: LocalizedField,
  dataPath: (string | number)[],
): { container: Record<string, unknown>; key: string } | null {
  let node: Record<string, unknown> = doc;
  let i = 0;
  for (let s = 0; s < field.path.length; s += 1) {
    const seg = field.path[s];
    const isLast = s === field.path.length - 1;

    if (seg.kind === "field") {
      if (dataPath[i] !== seg.name) return null;
      if (isLast) return { container: node, key: seg.name };
      const next = node[seg.name];
      if (next == null || typeof next !== "object") return null;
      node = next as Record<string, unknown>;
      i += 1;
      continue;
    }

    // array | block: data path must be [name, index, ...]
    const rows = node[seg.name];
    const index = dataPath[i + 1];
    if (
      dataPath[i] !== seg.name ||
      !Array.isArray(rows) ||
      typeof index !== "number"
    ) {
      return null;
    }
    const row = rows[index];
    if (!row || typeof row !== "object") return null;
    if (
      seg.kind === "block" &&
      (row as Record<string, unknown>).blockType !== seg.blockSlug
    ) {
      return null;
    }
    node = row as Record<string, unknown>;
    i += 2;
  }
  return null;
}
