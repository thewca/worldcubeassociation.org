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
 * Same code path as POST /api/translate/sync — both call `runSync` — but with
 * no HTTP session to arrange, which is what makes this the practical way to run
 * it from cron or against a local stack.
 *
 * `payload run` imports this module and nothing else: it does not call an
 * export or hand us a payload instance, so the work happens at module scope and
 * the process is closed explicitly at the end.
 */
import { getPayload } from "payload";
import config from "../src/payload.config";
import {
  collectSourceDocs,
  runSync,
  unitsFromDocs,
} from "../src/lib/translate/sync";
import { weblateConfigured } from "../src/lib/translate/weblate";

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
      log(`  ${key} = ${JSON.stringify(units[key]).slice(0, 80)}`);
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

    log(
      `pushed ${report.sourceStrings} source strings from ${report.documents} documents`,
    );
    for (const { locale, accepted } of report.seeded) {
      log(`  seeded ${locale}: ${accepted} accepted by Weblate`);
    }
    const written = report.applied.filter((r) => r.stringsWritten > 0);
    if (written.length === 0) {
      log("no translations to write back yet");
    }
    for (const r of written) {
      log(
        `  ${r.locale}: wrote ${r.stringsWritten} strings across ${r.documentsUpdated} documents`,
      );
    }
    // Payload validates required fields per locale, so a document is held back
    // until all of its required strings are translated. Report it, or a
    // translator who has done most of the work sees nothing happen.
    for (const r of report.applied) {
      for (const p of r.pending) {
        log(
          `  ${r.locale}: ${p.document} held back, ${p.missing}/${p.total} required strings still untranslated`,
        );
      }
    }
    // A leaf whose schema path no longer resolves can be translated in Weblate
    // but never written back, so it has to be visible somewhere.
    for (const r of report.applied) {
      for (const u of r.unresolved) {
        log(
          `  ${r.locale}: ${u.key} in ${u.document} no longer matches the stored document`,
        );
      }
    }
  }
} finally {
  // Payload keeps the Mongo connection open, which would hang the process.
  await payload.destroy();
}
