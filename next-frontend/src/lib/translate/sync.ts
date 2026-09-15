import type { CollectionSlug, GlobalSlug, Payload, TypedLocale } from "payload";
import _ from "lodash";
import { fallbackLng, languages } from "@/lib/i18n/settings";
import {
  ensureLanguage,
  pullTranslations,
  pushSource,
  pushTranslations,
} from "./weblate";
import {
  buildTranslationRegistry,
  resolveLeaf,
  resolveStrings,
  type LocalizedField,
} from "./registry";

/**
 * Turns Payload documents into the flat key/value units Weblate translates, and
 * writes translated units back.
 *
 * Rich text is the interesting half. Rather than shipping Lexical JSON to
 * translators (which is what forced the prototype to hand-roll an editor), each
 * *text node* becomes its own unit, keyed by its index path in the tree:
 *
 *   home:body            -> plain field
 *   home:body#0.1.0      -> the text node at root.children[0].children[1].children[0]
 *
 * Translators therefore see plain sentences. On write-back we deep-clone the
 * **source** Lexical state and substitute only `text` values, so structure,
 * node `version`s and any node type we have never heard of come from Payload
 * itself. A Payload or Lexical upgrade cannot corrupt a write, because we never
 * author the structure.
 */

interface LexicalNode {
  type?: string;
  text?: string;
  children?: unknown[];
}

function lexicalRoot(value: unknown): LexicalNode | null {
  const root = (value as { root?: unknown } | null | undefined)?.root;
  return root && typeof root === "object" ? (root as LexicalNode) : null;
}

/** Every non-blank text node in a Lexical value, with its index path. */
export function lexicalTextNodes(
  value: unknown,
): { path: string; text: string }[] {
  const visit = (
    node: unknown,
    path: number[],
  ): { path: string; text: string }[] => {
    if (!node || typeof node !== "object") return [];
    const n = node as LexicalNode;
    const self =
      n.type === "text" && typeof n.text === "string" && n.text.trim()
        ? [{ path: path.join("."), text: n.text }]
        : [];
    const children = Array.isArray(n.children)
      ? n.children.flatMap((child, i) => visit(child, [...path, i]))
      : [];
    return [...self, ...children];
  };

  const root = lexicalRoot(value);
  if (!root || !Array.isArray(root.children)) return [];
  return root.children.flatMap((child, i) => visit(child, [i]));
}

/** Clone `source` and replace the text of every node named in `texts`. */
export function applyLexicalTexts(
  source: unknown,
  texts: Map<string, string>,
): unknown {
  const clone = structuredClone(source);
  const visit = (node: unknown, path: number[]): void => {
    if (!node || typeof node !== "object") return;
    const n = node as LexicalNode;
    if (n.type === "text" && typeof n.text === "string") {
      const replacement = texts.get(path.join("."));
      if (replacement !== undefined) n.text = replacement;
    }
    if (Array.isArray(n.children)) {
      n.children.forEach((child, i) => visit(child, [...path, i]));
    }
  };
  const root = lexicalRoot(clone);
  if (root && Array.isArray(root.children)) {
    root.children.forEach((child, i) => visit(child, [i]));
  }
  return clone;
}

/** A localized leaf in one document, plus the units it produces. */
interface Leaf {
  field: LocalizedField;
  dataPath: (string | number)[];
  /** Unit key for a plain field; the prefix before `#` for rich text. */
  baseKey: string;
  source: unknown;
}

interface SourceDocBase {
  slug: string;
  doc: Record<string, unknown>;
  leaves: Leaf[];
}

/**
 * Discriminated so `docId` exists only where it can: a collection row always
 * has one, a global never does. Without the discriminant every read and write
 * below needs a non-null assertion on it.
 */
type SourceDoc =
  | (SourceDocBase & { type: "global" })
  | (SourceDocBase & { type: "collection"; docId: string });

/** How a document is named in a report: `home`, or `testimonials#64f2a…`. */
function docLabel(source: SourceDoc): string {
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
async function readDoc(
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
          resolveStrings(field, head.doc).map((string) => {
            // resolveStrings keys look like `slug:path`; re-compose so the
            // document id sits between them for collections.
            const path = string.key.slice(slug.length + 1);
            return {
              field,
              dataPath: string.dataPath,
              baseKey:
                head.type === "global"
                  ? `${slug}:${path}`
                  : `${slug}#${head.docId}:${path}`,
              source: string.value,
            };
          }),
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

/**
 * The value to store for one leaf in the target locale, or `undefined` when
 * Weblate has nothing for it.
 *
 * Rich text is all-or-nothing: a paragraph half in German and half in English
 * reads worse than the English original, which is what Payload's fallback shows
 * when we leave the field empty.
 */
function translatedValue(
  leaf: Leaf,
  translations: Record<string, string>,
): unknown | undefined {
  if (leaf.field.widget === "plain") {
    return translations[leaf.baseKey];
  }
  const nodes = lexicalTextNodes(leaf.source);
  if (nodes.length === 0) return undefined;
  const texts = new Map<string, string>();
  for (const node of nodes) {
    const value = translations[`${leaf.baseKey}#${node.path}`];
    if (value === undefined) return undefined;
    texts.set(node.path, value);
  }
  return applyLexicalTexts(leaf.source, texts);
}

export interface ApplyResult {
  locale: string;
  documentsUpdated: number;
  stringsWritten: number;
  /** Documents held back because a required field is still untranslated. */
  pending: { document: string; missing: number; total: number }[];
  /**
   * Leaves whose schema path no longer resolves against the stored document —
   * a block swapped for a different type, an array row removed. Reported
   * rather than skipped silently: the string still exists in Weblate and a
   * translator can work on it, but nothing will write it back until the two
   * shapes agree again.
   */
  unresolved: { document: string; key: string }[];
}

/** One leaf paired with what Weblate has for it; `undefined` means nothing yet. */
interface ResolvedLeaf {
  leaf: Leaf;
  value: unknown | undefined;
}

/**
 * Fill the localized leaves of `next` — a clone of the source document, so the
 * arrays and blocks exist in the target locale at all — from `resolved`,
 * falling back to whatever Payload already holds for this locale.
 */
function fillDocument(
  next: Record<string, unknown>,
  existing: Record<string, unknown> | null,
  resolved: ResolvedLeaf[],
): { written: ResolvedLeaf[]; unresolved: Leaf[] } {
  const located = resolved.map((entry) => ({
    entry,
    target: resolveLeaf(next, entry.leaf.field, entry.leaf.dataPath),
  }));

  located.forEach(({ entry, target }) => {
    if (!target) return;
    if (entry.value !== undefined) {
      target.container[target.key] = entry.value;
      return;
    }
    // Preserve anything already translated inside Payload that Weblate does
    // not know about; otherwise clear, so Payload falls back to English.
    const previous =
      existing && resolveLeaf(existing, entry.leaf.field, entry.leaf.dataPath);
    target.container[target.key] = previous
      ? (previous.container[previous.key] ?? null)
      : null;
  });

  return {
    written: located
      .filter(({ entry, target }) => target && entry.value !== undefined)
      .map(({ entry }) => entry),
    unresolved: located
      .filter(({ target }) => !target)
      .map(({ entry }) => entry.leaf),
  };
}

/** What one document contributed to the locale's result. */
interface DocumentResult {
  written: ResolvedLeaf[];
  pending: ApplyResult["pending"];
  unresolved: ApplyResult["unresolved"];
}

const NOTHING: DocumentResult = { written: [], pending: [], unresolved: [] };

/**
 * Write Weblate's translations for one document in `locale`.
 *
 * The document is written only once **every required localized field** in it
 * has a translation. Payload validates `required` per locale on write, so there
 * are only three options for a required field with no translation yet: write
 * null (Payload rejects it), write the English source (which then goes stale
 * and invisible the next time English changes), or hold the document back.
 * Holding it back is the only one that keeps Payload's own fallback working —
 * an untranslated locale reads as English *now*, not as English from whenever
 * the last sync ran.
 *
 * Optional fields have no such constraint, so they are cleared to null and fall
 * back individually.
 */
async function applyDocument(
  payload: Payload,
  locale: TypedLocale,
  source: SourceDoc,
  translations: Record<string, string>,
): Promise<DocumentResult> {
  if (source.leaves.length === 0) return NOTHING;

  // Resolved once and reused: the required-field check and the write below ask
  // the same question, and for rich text answering it walks the Lexical tree.
  const resolved: ResolvedLeaf[] = source.leaves.map((leaf) => ({
    leaf,
    value: translatedValue(leaf, translations),
  }));

  // Payload rejects the whole document if any required localized field is empty
  // for this locale, so check before doing any work.
  const missingRequired = resolved.filter(
    ({ leaf, value }) => leaf.field.required && value === undefined,
  );
  if (missingRequired.length > 0) {
    return {
      ...NOTHING,
      pending: [
        {
          document: docLabel(source),
          missing: missingRequired.length,
          total: source.leaves.length,
        },
      ],
    };
  }

  // Only read what Payload holds when something is untranslated — that is the
  // one case whose existing value has to be preserved.
  const existing = resolved.some(({ value }) => value === undefined)
    ? await readDoc(payload, source, locale)
    : null;

  const next = structuredClone(source.doc);
  const filled = fillDocument(next, existing, resolved);
  const unresolved = filled.unresolved.map((leaf) => ({
    document: docLabel(source),
    key: leaf.baseKey,
  }));

  if (filled.written.length === 0) return { ...NOTHING, unresolved };

  // Payload replaces arrays wholesale, so send whole top-level fields.
  const topLevel = _.uniq(
    source.leaves
      .map((leaf) => leaf.dataPath[0])
      .filter((key): key is string => typeof key === "string"),
  );
  const data = Object.fromEntries(topLevel.map((key) => [key, next[key]]));

  if (source.type === "global") {
    await payload.updateGlobal({
      slug: source.slug as GlobalSlug,
      locale,
      data,
    });
  } else {
    await payload.update({
      collection: source.slug as CollectionSlug,
      id: source.docId,
      locale,
      data,
    });
  }

  return { written: filled.written, pending: [], unresolved };
}

/** Write Weblate's translations for `locale` into Payload, document by document. */
export async function applyLocale(
  payload: Payload,
  locale: TypedLocale,
  docs: SourceDoc[],
  translations: Record<string, string>,
): Promise<ApplyResult> {
  const results: DocumentResult[] = [];
  // Sequential on purpose: writes go one document at a time so a failure
  // part-way through leaves a state that can be read off the report.
  for (const source of docs) {
    results.push(await applyDocument(payload, locale, source, translations));
  }

  return {
    locale,
    documentsUpdated: results.filter(({ written }) => written.length > 0)
      .length,
    stringsWritten: _.sumBy(results, ({ written }) => written.length),
    pending: results.flatMap(({ pending }) => pending),
    unresolved: results.flatMap(({ unresolved }) => unresolved),
  };
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

export interface SyncReport {
  sourceLocale: string;
  sourceStrings: number;
  documents: number;
  seeded: { locale: string; accepted: number }[];
  applied: ApplyResult[];
}

/** One language: seed it if asked, then pull its translations into Payload. */
async function syncLocale(
  payload: Payload,
  locale: TypedLocale,
  docs: SourceDoc[],
  seed: boolean,
): Promise<{ seeded: SyncReport["seeded"]; applied: ApplyResult }> {
  await ensureLanguage(locale);

  const existing = seed
    ? await collectExistingTranslations(payload, locale, docs)
    : {};
  const pushed =
    Object.keys(existing).length > 0
      ? await pushTranslations(locale, existing)
      : null;

  return {
    seeded: pushed ? [{ locale, accepted: pushed.accepted }] : [],
    applied: await applyLocale(
      payload,
      locale,
      docs,
      await pullTranslations(locale),
    ),
  };
}

/**
 * One full sync: push the source strings up, then pull each language back down.
 *
 * Shared by the HTTP route and `scripts/weblate-sync.ts`, so the CLI and the
 * endpoint can never drift apart on ordering or on the seeding rule.
 */
export async function runSync(
  payload: Payload,
  options: { seed?: boolean } = {},
): Promise<SyncReport> {
  const docs = await collectSourceDocs(payload);
  const source = unitsFromDocs(docs);

  await pushSource(source);

  const results: Awaited<ReturnType<typeof syncLocale>>[] = [];
  // Sequential on purpose: one language at a time keeps the write load on
  // Payload and on Weblate to what a single locale produces.
  for (const locale of languages.filter((code) => code !== fallbackLng)) {
    results.push(await syncLocale(payload, locale, docs, !!options.seed));
  }

  return {
    sourceLocale: fallbackLng,
    sourceStrings: Object.keys(source).length,
    documents: docs.length,
    seeded: results.flatMap(({ seeded }) => seeded),
    applied: results.map(({ applied }) => applied),
  };
}
