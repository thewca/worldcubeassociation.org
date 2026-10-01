import config, { wcaConfig } from "@payload-config";
import { getPayload } from "payload";
import { pluralize } from "mongoose";

// this mutes an annoying Payload warning about email providers, that would otherwise
//   end up in the console.log STDOUT stream
process.env.NEXT_PHASE = "phase-production-build";

async function auditSchema() {
  // Read confidential collection names passed directly from Bash arguments
  const confidentialExcludes = new Set(process.argv.slice(2));

  const payload = await getPayload({ config });

  // Fetch all collections physically present in MongoDB.
  //   This is a raw "which tables even exist at all in the DB" query to Mongo.
  const mongoDb = payload.db.connection.db!;
  const physicalCollections = (await mongoDb.listCollections().toArray())
    .map((c) => c.name)
    .filter((c) => !c.startsWith("system."));

  // Get all collections/models registered in Payload
  //   This is a "which schemas have you registered into the DB" query to Payload.
  const allPayloadCollections = Object.values(payload.db.connection.models).map(
    (m) => m.collection.name,
  );

  // CHECK 1: Detect raw/unmanaged physical tables in MongoDB.
  //   Is there anything in the DB that Payload does not know about AT ALL?
  const mongoSet = new Set(physicalCollections);
  const payloadSet = new Set(allPayloadCollections);

  const unmanagedPhysical = Array.from(mongoSet.difference(payloadSet));

  if (unmanagedPhysical.length > 0) {
    console.error(
      `\n❌ DATABASE AUDIT FAILED: MongoDB contains tables unknown to Payload:`,
      unmanagedPhysical,
      `\n`,
    );

    return process.exit(1);
  }

  // The table convention that MongoDB adapters use. Payload already sets this,
  //   so we are safe to use `!` assertions here.
  // Interestingly, this is a getter function which returns the pluralization function reference.
  //   The choice to name this getter as "pluralize" is a bit counter-intuitive, but it definitely
  //   is the same package as used by @payloadcms/db-mongodb.
  const pluralizer = pluralize()!;

  // Extract user-declared collections & globals from our own Payload config.
  //   Note that this is NOT using the resolved `payload` instance's exposed config,
  //   because in there the plugins already had a chance to add their stuff.
  const payloadTableNames = [...wcaConfig.collections, ...wcaConfig.globals]
    .map((cfg) => cfg.slug)
    .map(pluralizer);

  // Payload has the table "globals" to store global instances.
  const userDeclaredSlugs = new Set([...payloadTableNames, "globals"]);

  // Extract Payload internal collections. Stuff like `_foo_versions` is managed
  //   by the "Preview" feature (and subsequent "Publish" actions), and some other
  //   tables prefixed with `payload-*` are system locks.
  const payloadSystemSlugs = new Set(
    allPayloadCollections.filter(
      (slug) =>
        slug.startsWith("payload-") ||
        (slug.startsWith("_") && slug.endsWith("_versions")),
    ),
  );

  const unclassifiedPluginCollections = Array.from(
    payloadSet
      // Tables that we declared ourselves are fine to dump
      .difference(userDeclaredSlugs)
      // Payload system tables, like version revisions and global locks, are fine to dump
      .difference(payloadSystemSlugs)
      // Tables which we have declared that we won't dump anyway
      .difference(confidentialExcludes),
  );

  // CHECK 2: Are there any tables left, apart from our own collections/globals
  //   and Payload internals, which we haven't excluded yet?
  if (unclassifiedPluginCollections.length > 0) {
    console.error(
      `\n❌ SECURITY AUDIT FAILED: Plugin added unclassified collection(s):`,
      unclassifiedPluginCollections,
    );
    console.error(
      `Update your Bash script's CONFIDENTIAL_EXCLUDE array if these are sensitive.\n`,
    );

    return process.exit(1);
  }

  // Generate the --excludeCollection flags string for mongodump.
  //   This is much more ergonomic to do in JS than in Bash, so we pass it around here
  const excludeFlags = Array.from(confidentialExcludes)
    .map((c) => `--excludeCollection=${c}`)
    .join(" ");

  // Output ONLY the flags string to stdout for Bash to capture
  console.log(excludeFlags);
  process.exit(0);
}

auditSchema().catch((err) => {
  console.error(err);
  process.exit(1);
});
