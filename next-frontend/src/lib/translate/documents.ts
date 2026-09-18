import type { CollectionSlug, GlobalSlug, Payload, TypedLocale } from "payload";
import _ from "lodash";
import { fallbackLng } from "@/lib/i18n/settings";
import { lexicalTextNodes } from "./lexical";
import {
  buildTranslationRegistry,
  resolveLeaf,
  resolveStrings,
} from "./registry";
import type { LocalizedField } from "./registry";

/**
 * Reading Payload: which documents exist, which strings inside them are
 * translatable, and what Weblate should be told about them.
 *
 * The other direction — writing translations back — lives in `sync.ts`.
 */

/** A localized leaf in one document, plus the units it produces. */
export interface Leaf {
  field: LocalizedField;
  dataPath: (string | number)[];
  /**
   * Unit key for a plain field; the prefix before `#` for rich text. Reads
   * `slug:path` for a global and `slug#docId:path` for a collection row.
   */
  baseKey: string;
  source: unknown;
}

export interface SourceDocBase {
  slug: string;
  doc: Record<string, unknown>;
  leaves: Leaf[];
}

/**
 * Discriminated so `docId` exists only where it can: a collection row always
 * has one, a global never does. Without the discriminant every read and write
 * below needs a non-null assertion on it.
 */
export type SourceDoc =
  | (SourceDocBase & { type: "global" })
  | (SourceDocBase & { type: "collection"; docId: string });

/** How a document is named in a report: `home`, or `testimonials#64f2a…`. */
export function docLabel(source: SourceDoc): string {
  return source.type === "global"
    ? source.slug
    : `${source.slug}#${source.docId}`;
}

/** Payload's document types are not assignable to an index signature. */
function asRecord(doc: unknown): Record<string, unknown> {
  return doc as Record<string, unknown>;
}

/**
 * One document at one locale, with no fallback: the caller needs to see what is
 * actually stored for the locale, not what Payload would render.
 */
export async function readDoc(
  payload: Payload,
  source: SourceDoc,
  locale: TypedLocale,
): Promise<Record<string, unknown>> {
  const common = { locale, depth: 0, fallbackLocale: false } as const;
  return asRecord(
    source.type === "global"
      ? await payload.findGlobal({ slug: source.slug as GlobalSlug, ...common })
      : await payload.findByID({
          collection: source.slug as CollectionSlug,
          id: source.docId,
          ...common,
        }),
  );
}

/**
 * Read every document in the source locale and expand it into localized leaves.
 * Keys embed the document id so collection rows stay addressable and stable
 * across syncs; the path itself comes from the registry, which prefers a row's
 * `id` over its index.
 */
export async function collectSourceDocs(
  payload: Payload,
): Promise<SourceDoc[]> {
  const byParent = _.groupBy(
    buildTranslationRegistry(payload.config),
    (field) => `${field.parent.type}:${field.parent.slug}`,
  );

  const perParent = await Promise.all(
    Object.values(byParent).map(async (fields): Promise<SourceDoc[]> => {
      const { type, slug } = fields[0].parent;

      const heads: (
        | { type: "global"; doc: Record<string, unknown> }
        | { type: "collection"; docId: string; doc: Record<string, unknown> }
      )[] =
        type === "global"
          ? [
              {
                type,
                doc: asRecord(
                  await payload.findGlobal({
                    slug: slug as GlobalSlug,
                    locale: fallbackLng,
                    depth: 0,
                  }),
                ),
              },
            ]
          : (
              await payload.find({
                collection: slug as CollectionSlug,
                locale: fallbackLng,
                depth: 0,
                pagination: false,
              })
            ).docs.map((doc) => ({
              type,
              docId: String(doc.id),
              doc: asRecord(doc),
            }));

      return heads.map((head) => ({
        ...head,
        slug,
        leaves: fields.flatMap((field) =>
          resolveStrings(field, head.doc).map((string) => ({
            field,
            dataPath: string.dataPath,
            baseKey:
              head.type === "global"
                ? `${slug}:${string.keyPath}`
                : `${slug}#${head.docId}:${string.keyPath}`,
            source: string.value,
          })),
        ),
      }));
    }),
  );

  return perParent.flat();
}

/** Flat source strings for Weblate, keyed exactly as they will come back. */
export function unitsFromDocs(docs: SourceDoc[]): Record<string, string> {
  return Object.fromEntries(
    docs.flatMap(({ leaves }) =>
      leaves.flatMap((leaf): [string, string][] => {
        if (leaf.field.widget === "plain") {
          return typeof leaf.source === "string" && leaf.source.trim()
            ? [[leaf.baseKey, leaf.source]]
            : [];
        }
        return lexicalTextNodes(leaf.source).map((node) => [
          `${leaf.baseKey}#${node.path}`,
          node.text,
        ]);
      }),
    ),
  );
}

/** Existing Payload translations for `locale`, keyed like the source units. */
export async function collectExistingTranslations(
  payload: Payload,
  locale: TypedLocale,
  docs: SourceDoc[],
): Promise<Record<string, string>> {
  const perDoc = await Promise.all(
    docs
      .filter((source) => source.leaves.length > 0)
      .map(async (source): Promise<[string, string][]> => {
        const doc = await readDoc(payload, source, locale);

        return source.leaves.flatMap((leaf): [string, string][] => {
          // A leaf that does not resolve is the shape mismatch applyDocument
          // reports; on the seed path it simply means there is nothing stored
          // to upload for it.
          const resolved = resolveLeaf(doc, leaf.field, leaf.dataPath);
          const value = resolved?.container[resolved.key];
          if (value == null) return [];

          if (leaf.field.widget === "plain") {
            return typeof value === "string" && value.trim()
              ? [[leaf.baseKey, value]]
              : [];
          }

          // Only meaningful when the translated tree still matches the source
          // shape; a mismatch means the structures diverged and the safe move is
          // to let the translator start from the source.
          const targetNodes = new Map(
            lexicalTextNodes(value).map((node) => [node.path, node.text]),
          );
          return lexicalTextNodes(leaf.source).flatMap((node) => {
            const text = targetNodes.get(node.path);
            return text ? [[`${leaf.baseKey}#${node.path}`, text]] : [];
          });
        });
      }),
  );

  return Object.fromEntries(perDoc.flat());
}
