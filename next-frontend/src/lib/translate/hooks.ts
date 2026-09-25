import type { CollectionConfig, GlobalConfig, Payload } from "payload";
import { fallbackLng } from "@/lib/i18n/settings";
import { runSync } from "./sync";
import { weblateConfigured } from "./weblate";

/**
 * Keep Weblate in step with Payload edits.
 *
 * `runSync` is both directions at once — push the source strings up, pull
 * finished translations back down — so one `afterChange` hook covers "a source
 * string changed, Weblate should know" and "translations done since the last
 * sync should land". What it cannot cover is work finished in Weblate while
 * nobody edits Payload; that still needs `scripts/weblate-sync.ts` on a
 * schedule.
 *
 * Two things keep this from feeding itself:
 *
 * - The sync writes documents in target locales, and this hook only fires for
 *   writes in the source locale, so a write-back cannot trigger another sync.
 * - `inFlight` collapses a burst of edits (a save touches several documents)
 *   into one run instead of one per document.
 */
let inFlight: Promise<unknown> | null = null;

function syncSoon(payload: Payload): void {
  if (!weblateConfigured || inFlight) return;
  inFlight = runSync(payload)
    .catch((error) => {
      payload.logger.error({ err: error }, "weblate: sync after change failed");
    })
    .finally(() => {
      inFlight = null;
    });
}

// The hook is deliberately not awaited: Weblate being slow or down must not
// fail the editor's save.
export const weblateAfterChange = ({
  req,
}: {
  req: { locale?: string; payload: Payload };
}): void => {
  if ((req.locale ?? fallbackLng) !== fallbackLng) return;
  syncSoon(req.payload);
};

/**
 * Payload has no config-level `afterChange`, so the hook is attached to each
 * collection and global in `payload.config.ts`. Reading only `req` means the
 * same handler fits both signatures.
 */
export function withWeblateSync<T extends CollectionConfig | GlobalConfig>(
  entity: T,
): T {
  return {
    ...entity,
    hooks: {
      ...entity.hooks,
      afterChange: [...(entity.hooks?.afterChange ?? []), weblateAfterChange],
    },
  } as T;
}
