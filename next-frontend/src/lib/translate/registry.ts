import {
  flattenAllFields,
  type Field,
  type FlattenedBlock,
  type FlattenedField,
  type Tab,
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
  widget: Widget;
  /**
   * Payload enforces `required` per locale on write, so a document cannot be
   * saved in a target locale until every required localized field has a value.
   * The sync uses this to decide whether a document is writable yet.
   */
  required: boolean;
}

/** A concrete translatable string, resolved against a specific document. */
export interface TranslatableString {
  /** Concrete data path including array/block indices, e.g. ["blocks", 0, "body"]. */
  dataPath: (string | number)[];
  /**
   * Path to this exact string within its document, e.g. `blocks[a1].heading`
   * (uses a block/array row's `id` when it has one, so the path survives
   * reordering). `documents.ts` prefixes the document to make a unit key.
   */
  keyPath: string;
  value: unknown;
}

type RegistrySource = {
  collections: { slug: string; fields: Field[] }[];
  globals: { slug: string; fields: Field[] }[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

function isBlock(row: unknown, blockSlug: string): boolean {
  return isRecord(row) && row.blockType === blockSlug;
}

/**
 * `fieldShouldBeLocalized` implements Payload's "no localized-within-localized"
 * rule, so it returns false for a field inside a localized container: the
 * container's own answer has to be carried down separately.
 */
function isLocalized(field: Field | Tab, parentIsLocalized: boolean): boolean {
  return (
    parentIsLocalized || fieldShouldBeLocalized({ field, parentIsLocalized })
  );
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
): LocalizedField[] {
  return fields.flatMap((field): LocalizedField[] => {
    switch (field.type) {
      // Named object containers (unnamed ones were collapsed by flattening).
      case "group":
      case "tab":
        return walk(
          field.flattenedFields,
          parent,
          [...basePath, { kind: "field", name: field.name }],
          isLocalized(field, parentIsLocalized),
        );

      case "array":
        return walk(
          field.flattenedFields,
          parent,
          [...basePath, { kind: "array", name: field.name }],
          isLocalized(field, parentIsLocalized),
        );

      case "blocks": {
        // FlattenedBlocksField narrows `blocks` to FlattenedBlock[], so it isn't
        // structurally a Field; the helper only reads `.localized`.
        const childIsLocalized = isLocalized(field as Field, parentIsLocalized);
        // flattenAllFields resolves inline blocks and object references to
        // FlattenedBlock; bare string references (defined in `config.blocks`)
        // can't be resolved without the config and are skipped.
        return (field.blockReferences ?? field.blocks)
          .filter((block): block is FlattenedBlock => typeof block !== "string")
          .flatMap((block) =>
            walk(
              block.flattenedFields,
              parent,
              [
                ...basePath,
                { kind: "block", name: field.name, blockSlug: block.slug },
              ],
              childIsLocalized,
            ),
          );
      }

      case "text":
      case "textarea":
      case "richText": {
        if (!isLocalized(field, parentIsLocalized)) return [];
        const path: PathSegment[] = [
          ...basePath,
          { kind: "field", name: field.name },
        ];
        return [
          {
            parent,
            path,
            pathString: `${parent.slug}.${path.map(segmentToString).join(".")}`,
            widget: field.type === "richText" ? "lexical" : "plain",
            required: field.required === true,
          },
        ];
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
        return [];
    }
  });
}

/**
 * Walk all collections and globals, returning every localized free-text field.
 * Pass `payload.config` (a SanitizedConfig) at runtime.
 */
export function buildTranslationRegistry(
  config: RegistrySource,
): LocalizedField[] {
  return [
    ...config.collections.flatMap((collection) =>
      walk(
        flattenAllFields({ fields: collection.fields }),
        { type: "collection", slug: collection.slug },
        [],
        false,
      ),
    ),
    ...config.globals.flatMap((global) =>
      walk(
        flattenAllFields({ fields: global.fields }),
        { type: "global", slug: global.slug },
        [],
        false,
      ),
    ),
  ];
}

/**
 * Expand one schema descriptor against a fetched document into concrete strings.
 * `doc` should be a single document/global fetched at one locale.
 */
export function resolveStrings(
  field: LocalizedField,
  doc: Record<string, unknown>,
): TranslatableString[] {
  const recurse = (
    segs: PathSegment[],
    node: unknown,
    dataPath: (string | number)[],
    keyParts: string[],
  ): TranslatableString[] => {
    if (!isRecord(node)) return [];
    const [seg, ...rest] = segs;

    if (seg.kind === "field") {
      if (rest.length > 0) {
        return recurse(
          rest,
          node[seg.name],
          [...dataPath, seg.name],
          [...keyParts, seg.name],
        );
      }
      return [
        {
          dataPath: [...dataPath, seg.name],
          keyPath: [...keyParts, seg.name].join("."),
          value: node[seg.name] ?? null,
        },
      ];
    }

    // array | block: iterate rows, preferring a stable `id` for the path.
    const rows = node[seg.name];
    if (!Array.isArray(rows)) return [];
    return rows.flatMap((row, index) => {
      if (seg.kind === "block" && !isBlock(row, seg.blockSlug)) return [];
      const id = isRecord(row) ? row.id : undefined;
      return recurse(
        rest,
        row,
        [...dataPath, seg.name, index],
        [...keyParts, `${seg.name}[${id ?? index}]`],
      );
    });
  };

  return recurse(field.path, doc, [], []);
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
  const step = (
    node: Record<string, unknown>,
    segs: PathSegment[],
    path: (string | number)[],
  ): { container: Record<string, unknown>; key: string } | null => {
    // A path that runs out mid-walk never reached a leaf. `walk` only ever
    // ends a path on a `field` segment, so this is a malformed descriptor.
    if (segs.length === 0) return null;
    const [seg, ...rest] = segs;
    if (path[0] !== seg.name) return null;

    if (seg.kind === "field") {
      if (rest.length === 0) return { container: node, key: seg.name };
      const next = node[seg.name];
      return isRecord(next) ? step(next, rest, path.slice(1)) : null;
    }

    // array | block: the data path must read [name, index, ...]
    const rows = node[seg.name];
    const index = path[1];
    if (!Array.isArray(rows) || typeof index !== "number") return null;

    const row = rows[index];
    if (!isRecord(row)) return null;
    if (seg.kind === "block" && !isBlock(row, seg.blockSlug)) return null;
    return step(row, rest, path.slice(2));
  };

  return step(doc, field.path, dataPath);
}
