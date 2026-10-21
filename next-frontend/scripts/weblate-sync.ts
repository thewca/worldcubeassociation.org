/**
 * Sync Payload CMS content with Weblate from the command line.
 *
 *   yarn payload run scripts/weblate-sync.ts           # routine sync
 *   yarn payload run scripts/weblate-sync.ts seed      # first run only
 *   yarn payload run scripts/weblate-sync.ts dry-run   # report, touch nothing
 *
 * The arguments are positional rather than `--flags` because `payload run`
 * parses argv with minimist and passes only the positional remainder through;
 * a `--flag` would be swallowed and silently ignored.
 *
 * Same code path as the `afterChange` hook and the dashboard buttons — all call
 * `runSync`. Development only: the standalone production build has no
 * `payload` CLI, so production runs go through the buttons (see `endpoint.ts`).
 *
 * `payload run` imports this module and nothing else: it does not call an
 * export or hand us a payload instance, so the work happens at module scope and
 * the process is closed explicitly at the end.
 */
import { getPayload } from "payload";
import config from "../src/payload.config";
import { logSyncReport, runSync } from "@/lib/translate/sync";
import { collectSourceDocs, unitsFromDocs } from "@/lib/translate/documents";
import { weblateConfigured } from "@/lib/translate/weblate";

const seed = process.argv.includes("seed");
const dryRun = process.argv.includes("dry-run");

const payload = await getPayload({ config });
const log = (message: string) => payload.logger.info(message);

try {
  if (dryRun) {
    const docs = await collectSourceDocs(payload);
    const units = unitsFromDocs(docs);
    const keys = Object.keys(units);
    log(
      `dry run: ${keys.length} source strings across ${docs.length} documents`,
    );
    for (const key of keys.slice(0, 25)) {
      log(`  ${key} = ${JSON.stringify(units[key].message).slice(0, 80)}`);
    }
    if (keys.length > 25) log(`  ... and ${keys.length - 25} more`);
  } else {
    if (!weblateConfigured) {
      throw new Error(
        "WEBLATE_TOKEN is not set. Add it to next-frontend/.env — " +
          "weblate/seed-payload.sh prints the token for the local instance.",
      );
    }
    if (seed) {
      log(
        "seeding: existing Payload translations go to Weblate before pulling",
      );
    }

    const report = await runSync(payload, { seed });

    logSyncReport(log, report);
  }
} finally {
  // Payload keeps the Mongo connection open, which would hang the process.
  await payload.destroy();
}
