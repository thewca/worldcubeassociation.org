import type { CollectionSlug, GlobalSlug, Payload, TypedLocale } from "payload";
import _ from "lodash";
import { fallbackLng, languages } from "@/lib/i18n/settings";
import {
  ensureLanguage,
  pullTranslations,
  pushSource,
  pushTranslations,
} from "./weblate";
import { applyLexicalTexts, lexicalTextNodes } from "./lexical";
import { resolveLeaf } from "./registry";
import {
  collectExistingTranslations,
  collectSourceDocs,
  docLabel,
  readDoc,
  unitsFromDocs,
} from "./documents";
import type { Leaf, SourceDoc } from "./documents";

/**
 * Writing translations back into Payload, and the sync that ties the two
 * directions together. Reading Payload lives in `documents.ts`.
 */

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
 * Shared by the `afterChange` hook and `scripts/weblate-sync.ts`, so the
 * automatic and manual runs can never drift apart on ordering or on the
 * seeding rule.
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
