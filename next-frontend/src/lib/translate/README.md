# What the Payload ↔ Weblate sync library does

A library that syncs localized Payload fields to Weblate and back.

| Module | Direction | Responsibility |
| --- | --- | --- |
| `registry.ts` | — | Introspect the Payload config: which fields are localized, where they live in a document |
| `lexical.ts` | both | Turn rich text into flat sentences and back again |
| `documents.ts` | Payload → Weblate | Read documents, expand them into translation units |
| `weblate.ts` | both | Minimal Weblate REST client |
| `sync.ts` | Weblate → Payload | Write translations back, and orchestrate one full run |
| `hooks.ts` | — | Fire a sync when an editor saves |

## The pipeline

```
payload.config
     │  buildTranslationRegistry()                        registry.ts
     ▼
LocalizedField[]        "home.blocks(TextCard)[].body" — schema, no document yet
     │  collectSourceDocs() → resolveStrings()            documents.ts
     ▼
SourceDoc[] (doc + Leaf[])   concrete paths: ["blocks", 0, "body"]
     │  unitsFromDocs() → lexicalTextNodes()              documents.ts + lexical.ts
     ▼
Record<key, string>     flat units, one per sentence
     │  pushSource()                                      weblate.ts
     ▼
                    ─── Weblate: translators work ───
     │  pullTranslations()                                weblate.ts
     ▼
Record<key, string>     translated units for one locale
     │  applyLocale() → applyDocument() → fillDocument()  sync.ts
     ▼
payload.update() / payload.updateGlobal() in the target locale
```

## Key formats

Two different string formats:

**`pathString`** carries the block slug, no indices:

```
home.blocks(TextCard)[].body
```

**Unit key** is what Weblate actually stores. Document id, row ids, and for rich text a node path:

```
home:blocks[a1].heading              global, plain text
testimonials#64f2a:quote             collection row, plain text
home:blocks[a1].body#0.1.0           global, one text node inside a rich text field
```

Keys must be stable across syncs, a changed key is a new, untranslated unit in Weblate.

---

## `registry.ts` — what can be translated

### `buildTranslationRegistry(config): LocalizedField[]`

Walks every collection and global in `payload.config` and returns one entry per localized
free-text leaf (`text`, `textarea`, `richText`).

- Non-text leaves (number, checkbox, select, upload, relationship) are skipped
- An unrecognised field type that *carries sub-fields* throws instead of returning `[]`.
- A blocks field that references a block by bare slug (defined in `config.blocks`) also throws.

### `resolveStrings(field, doc): TranslatableString[]`

Expands one schema descriptor against a real document: `blocks(TextCard)[].heading` becomes one
entry per matching block instance.

### `resolveLeaf(doc, field, dataPath): { container, key } | null`

Walks the schema path and the data path together. Returns `null` when the path no longer resolves (a block was
swapped for another type, a row was deleted), which is how `sync.ts` detects shape drift.

---

## `lexical.ts` — rich text as sentences

Translators get plain sentences, not Lexical JSON.

### `lexicalTextNodes(value): { path, text }[]`

Every non-blank text node in a Lexical value, each with its index path (`"0.1.0"`).

### `applyLexicalTexts(source, texts): unknown`

Deep-clones the **source** editor state and substitutes only `text` values at the paths given.

(Payload's `convertLexicalToPlaintext` is not a substitute: it flattens to one lossy string that
cannot be written back.)

---

## `documents.ts` — reading Payload

### `collectSourceDocs(payload): SourceDoc[]`

Reads every document of every collection and global and expands it into `Leaf`s (field descriptor + `dataPath` + `baseKey` + source value).

### `unitsFromDocs(docs): Record<string, string>`

Flattens those leaves into the map uploaded to Weblate. A plain field contributes one unit, keyed
by `baseKey`.

---

## `weblate.ts` — the REST client

The component is created with `vcs: "local"`, so there is no external git repo of generated JSON.
Files move purely over the API. `file_format` is flat `json` on purpose: keys are dotted paths
like `home:blocks[a1].body#0.1.0`, and `json-nested` would split them on the dots into a tree that
no longer round-trips.

Details worth knowing:

- `pushSource` uses `method=replace`, which is what lets strings deleted from Payload disappear
  from Weblate. With `translate` they would linger as orphaned units forever.
- `pullTranslations` drops empty strings, so an untranslated unit never overwrites anything.

---

## `sync.ts` — writing back, and the run itself

### `runSync(payload, { seed }): SyncReport`

One full sync, shared by both entry points so they cannot drift apart on ordering or on the
seeding rule:

1. `collectSourceDocs` + `unitsFromDocs` → `pushSource` (English up).
2. For each non-English locale, sequentially (`syncLocale`): `ensureLanguage`, optionally seed,
   `pullTranslations`, `applyLocale`. Sequential on purpose — one locale at a time bounds the write load on both sides.

`seed: true` additionally uploads translations that already exist in Payload *before* pulling.
That is a one-time migration step. Routine syncs never push translations upward, because doing so
would overwrite newer translator work with whatever Payload happens to hold.

### `applyDocument` (internal)

- **Required fields gate the whole document.** Payload validates `required` per locale on write,
  so a document with any untranslated required field is *held back* and reported in `pending`.
- **Optional fields are cleared to `null`** when Weblate has nothing, so they fall back
  individually.
- **The written document is a clone of the source document**, so arrays and blocks exist in the
  target locale at all; only localized leaves are then overwritten.
- Anything already translated inside Payload that Weblate doesn't know about is preserved.
  `applyDocument` reads the existing locale document only when something is untranslated, and
  `fillDocument` copies the stored value over for those leaves.
- A document with nothing translated is not written at all.
- Whole top-level fields are sent, because Payload replaces arrays wholesale.
- Leaves whose `dataPath` no longer resolves land in `unresolved` rather than being skipped
  silently: the string exists in Weblate and a translator can work on it, but nothing will write
  it back until the shapes agree again.

---

## `hooks.ts` — when it runs automatically

### `withWeblateSync(entity)`

Appends `weblateAfterChange` to a collection's or global's `afterChange` hooks

### `weblateAfterChange({ req })`

Fires a sync after an editor saves

What it cannot cover is translation work finished in Weblate while nobody edits Payload, that
needs the CLI on a schedule.
