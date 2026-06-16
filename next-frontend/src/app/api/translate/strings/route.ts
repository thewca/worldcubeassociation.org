import { NextRequest } from "next/server";
import { getPayload } from "payload";
import type { CollectionSlug, GlobalSlug } from "payload";
import config from "@payload-config";
import { fallbackLng } from "@/lib/i18n/settings";
import {
  buildTranslationRegistry,
  resolveStrings,
  resolveLeaf,
  type LocalizedField,
  type Widget,
} from "@/lib/translate/registry";
import { canTranslateLocale, isValidLocale } from "@/lib/translate/permissions";

// NOTE: all routes are guarded by the NextAuth middleware (src/proxy.ts); this
// handler additionally verifies the Payload session and per-locale permission.

type Status = "translated" | "untranslated";

interface StringItem {
  key: string;
  pathString: string;
  widget: Widget;
  parentType: LocalizedField["parent"]["type"];
  parentSlug: string;
  docId: string | null;
  dataPath: (string | number)[];
  source: unknown;
  target: unknown;
  status: Status;
}

/** Flatten a Lexical editor value to plain text so we can judge emptiness. */
function lexicalText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as unknown as Record<string, unknown>;
  let text = typeof n.text === "string" ? n.text : "";
  const children = (n.children ??
    (n.root as unknown as Record<string, unknown>)?.children) as
    | unknown[]
    | undefined;
  if (Array.isArray(children)) {
    for (const child of children) text += lexicalText(child);
  }
  return text;
}

function hasContent(value: unknown, widget: Widget): boolean {
  if (value == null) return false;
  if (widget === "lexical") return lexicalText(value).trim().length > 0;
  return String(value).trim().length > 0;
}

interface PatchBody {
  locale?: string;
  parentType?: "collection" | "global";
  parentSlug?: string;
  docId?: string | null;
  dataPath?: (string | number)[];
  value?: unknown;
}

function entriesForDoc(
  fields: LocalizedField[],
  sourceDoc: Record<string, unknown>,
  targetDoc: Record<string, unknown>,
  docId: string | null,
): StringItem[] {
  const items: StringItem[] = [];
  for (const field of fields) {
    const targetByKey = new Map(
      resolveStrings(field, targetDoc).map((s) => [s.key, s]),
    );
    for (const src of resolveStrings(field, sourceDoc)) {
      const target = targetByKey.get(src.key);
      const targetValue = target?.value ?? null;
      items.push({
        key: `${docId ?? "global"}:${src.key}`,
        pathString: field.pathString,
        widget: field.widget,
        parentType: field.parent.type,
        parentSlug: field.parent.slug,
        docId,
        // Rows are shared across locales (keyed by id), so the source path is
        // the correct write target unless the container itself is localized.
        dataPath: src.dataPath,
        source: src.value,
        target: targetValue,
        status: hasContent(targetValue, field.widget)
          ? "translated"
          : "untranslated",
      });
    }
  }
  return items;
}

export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config });

  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locale = new URL(req.url).searchParams.get("locale");
  if (!locale || !isValidLocale(locale)) {
    return Response.json(
      { error: "Unknown or missing locale" },
      { status: 400 },
    );
  }
  if (locale === fallbackLng) {
    return Response.json(
      { error: "The source locale is not translatable" },
      { status: 400 },
    );
  }
  if (!canTranslateLocale(user.roles as string[] | undefined, locale)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Group localized fields by their owning collection/global so each document
  // is fetched once per locale instead of once per field.
  const byParent = new Map<string, LocalizedField[]>();
  for (const field of buildTranslationRegistry(payload.config)) {
    const id = `${field.parent.type}:${field.parent.slug}`;
    const existing = byParent.get(id);
    if (existing) existing.push(field);
    else byParent.set(id, [field]);
  }

  const items: StringItem[] = [];

  for (const fields of byParent.values()) {
    const { type, slug } = fields[0].parent;
    // `fallbackLocale: false` is essential: otherwise empty target fields fall
    // back to English and would be miscounted as already translated.
    if (type === "global") {
      const [sourceDoc, targetDoc] = await Promise.all([
        payload.findGlobal({
          slug: slug as GlobalSlug,
          locale: fallbackLng,
          depth: 0,
        }),
        payload.findGlobal({
          slug: slug as GlobalSlug,
          locale,
          depth: 0,
          fallbackLocale: false,
        }),
      ]);
      items.push(
        ...entriesForDoc(
          fields,
          sourceDoc as unknown as Record<string, unknown>,
          targetDoc as unknown as Record<string, unknown>,
          null,
        ),
      );
    } else {
      const [source, target] = await Promise.all([
        payload.find({
          collection: slug as CollectionSlug,
          locale: fallbackLng,
          depth: 0,
          pagination: false,
        }),
        payload.find({
          collection: slug as CollectionSlug,
          locale,
          depth: 0,
          fallbackLocale: false,
          pagination: false,
        }),
      ]);
      const targetById = new Map(
        target.docs.map((d) => [
          String(d.id),
          d as unknown as Record<string, unknown>,
        ]),
      );
      for (const sourceDoc of source.docs) {
        const docId = String(sourceDoc.id);
        const targetDoc = targetById.get(docId) ?? {};
        items.push(
          ...entriesForDoc(
            fields,
            sourceDoc as unknown as Record<string, unknown>,
            targetDoc,
            docId,
          ),
        );
      }
    }
  }

  const translated = items.filter((i) => i.status === "translated").length;
  return Response.json({
    locale,
    sourceLocale: fallbackLng,
    progress: {
      total: items.length,
      translated,
      percent: items.length
        ? Math.round((translated / items.length) * 100)
        : 100,
    },
    items,
  });
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config });

  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { locale, parentType, parentSlug, dataPath, value } = body;
  const docId = body.docId ?? null;

  if (!locale || !isValidLocale(locale) || locale === fallbackLng) {
    return Response.json(
      { error: "Unknown or untranslatable locale" },
      { status: 400 },
    );
  }
  if (
    (parentType !== "collection" && parentType !== "global") ||
    typeof parentSlug !== "string" ||
    !Array.isArray(dataPath) ||
    dataPath.length === 0 ||
    typeof dataPath[0] !== "string"
  ) {
    return Response.json({ error: "Malformed write target" }, { status: 400 });
  }
  if (parentType === "collection" && !docId) {
    return Response.json(
      { error: "docId is required for collections" },
      { status: 400 },
    );
  }
  if (!canTranslateLocale(user.roles as string[] | undefined, locale)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only fields the registry knows to be localized may be written.
  const fields = buildTranslationRegistry(payload.config).filter(
    (f) => f.parent.type === parentType && f.parent.slug === parentSlug,
  );
  if (fields.length === 0) {
    return Response.json(
      { error: "Unknown collection or global" },
      { status: 404 },
    );
  }

  // Read the current target-locale document so we can apply a single leaf write
  // and send back only the containing top-level field (Payload replaces arrays
  // wholesale, so a partial nested write is not possible).
  const targetDoc =
    parentType === "global"
      ? await payload.findGlobal({
          slug: parentSlug as GlobalSlug,
          locale,
          depth: 0,
          fallbackLocale: false,
        })
      : await payload.findByID({
          collection: parentSlug as CollectionSlug,
          id: docId!,
          locale,
          depth: 0,
          fallbackLocale: false,
        });

  const clone = structuredClone(targetDoc) as unknown as Record<
    string,
    unknown
  >;

  let matched: LocalizedField | null = null;
  let leaf: { container: Record<string, unknown>; key: string } | null = null;
  for (const field of fields) {
    const resolved = resolveLeaf(clone, field, dataPath);
    if (resolved) {
      matched = field;
      leaf = resolved;
      break;
    }
  }
  if (!matched || !leaf) {
    return Response.json(
      { error: "Not a writable localized field" },
      { status: 400 },
    );
  }

  // Enforce that the value matches how this field is edited (plain text vs
  // Lexical), allowing null to clear a translation.
  const validValue =
    value === null ||
    (matched.widget === "plain"
      ? typeof value === "string"
      : typeof value === "object");
  if (!validValue) {
    return Response.json(
      { error: "Value does not match field type" },
      { status: 422 },
    );
  }

  leaf.container[leaf.key] = value;
  const data = { [dataPath[0] as string]: clone[dataPath[0] as string] };

  if (parentType === "global") {
    await payload.updateGlobal({
      slug: parentSlug as GlobalSlug,
      locale,
      data,
    });
  } else {
    await payload.update({
      collection: parentSlug as CollectionSlug,
      id: docId!,
      locale,
      data,
    });
  }

  return Response.json({
    ok: true,
    status: hasContent(value, matched.widget) ? "translated" : "untranslated",
  });
}
