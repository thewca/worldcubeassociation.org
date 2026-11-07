import type { CollectionConfig, GlobalConfig, Payload } from "payload";
import _ from "lodash";
import { fallbackLng } from "@/lib/i18n/settings";
import { buildTranslationRegistry, resolveStrings } from "./registry";
import { logSyncReport, runSync } from "./sync";
import { weblateConfigured } from "./weblate";

/**
 * Keep Weblate in step with Payload edits.
 *
 * `runSync` is both directions at once — push the source strings up, pull
 * finished translations back down — so one `afterChange` hook covers "a source
 * string changed, Weblate should know" and "translations done since the last
 * sync should land". What it cannot cover is work finished in Weblate while
 * nobody edits Payload; for that an admin presses "Sync now" on the Payload
 * dashboard (`endpoint.ts`).
 *
 * Two things keep this from feeding itself:
 *
 * - The sync writes documents in target locales, and this hook only fires for
 *   writes in the source locale, so a write-back cannot trigger another sync.
 * - `inFlight` collapses a burst of edits (a save touches several documents)
 *   into one run instead of one per document.
 *
 * A save that leaves every localized leaf as it was (a checkbox, an upload, a
 * relationship) has nothing for Weblate, so it does not sync at all.
 */
let inFlight: Promise<unknown> | null = null;

/**
 * Start a sync in the background unless one is already running in this
 * process. Returns whether it started. Shared with the admin endpoint in
 * `endpoint.ts`, so a button press and a save never run side by side.
 */
export function syncSoon(
  payload: Payload,
  options: { shouldSeed?: boolean } = {},
): boolean {
  if (!weblateConfigured || inFlight) return false;
  inFlight = runSync(payload, options)
    .then((report) =>
      logSyncReport((message) => payload.logger.info(message), report),
    )
    .catch((error) => {
      payload.logger.error({ err: error }, "weblate: sync failed");
    })
    .finally(() => {
      inFlight = null;
    });
  return true;
}

/**
 * Compares whole leaf values rather than the units Weblate sees, so a rich-text
 * formatting change still syncs: the write-back copies the source structure.
 */
function localizedContentChanged(
  payload: Payload,
  parent: { type: "collection" | "global"; slug?: string },
  doc: Record<string, unknown>,
  previousDoc: Record<string, unknown>,
): boolean {
  const fields = buildTranslationRegistry(payload.config).filter(
    (field) =>
      field.parent.type === parent.type && field.parent.slug === parent.slug,
  );
  const leaves = (target: Record<string, unknown>) =>
    fields
      .flatMap((field) => resolveStrings(field, target))
      .map(({ keyPath, value }) => [keyPath, value]);
  return !_.isEqual(leaves(doc), leaves(previousDoc));
}

// The hook is deliberately not awaited: Weblate being slow or down must not
// fail the editor's save.
export const weblateAfterChange = ({
  req,
  doc,
  previousDoc,
  collection,
  global,
}: {
  req: { locale?: string; payload: Payload };
  doc: Record<string, unknown>;
  previousDoc?: Record<string, unknown>;
  collection?: { slug: string };
  global?: { slug: string };
}): void => {
  if ((req.locale ?? fallbackLng) !== fallbackLng) return;
  const parent = collection
    ? { type: "collection" as const, slug: collection.slug }
    : { type: "global" as const, slug: global?.slug };
  if (!localizedContentChanged(req.payload, parent, doc, previousDoc ?? {})) {
    return;
  }
  syncSoon(req.payload);
};

/**
 * Payload has no config-level `afterChange`, so the hook is attached to each
 * collection and global in `payload.config.ts`. Taking `collection` and
 * `global` as optional means the same handler fits both signatures.
 */
export function withWeblateSync<T extends CollectionConfig | GlobalConfig>(
  entity: T,
) {
  return {
    ...entity,
    hooks: {
      ...entity.hooks,
      afterChange: [...(entity.hooks?.afterChange ?? []), weblateAfterChange],
    },
  };
}
