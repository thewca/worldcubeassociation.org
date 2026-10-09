import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config, { wcaConfig } from "@payload-config";
import { pluralize } from "mongoose";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("x-manifest-secret");

  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== process.env.PAYLOAD_MANIFEST_PASSWORD
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const userDeclaredSlugs = [...payloadTableNames, "globals"];

  // Extract Payload internal collections. Stuff like `_foo_versions` is managed
  //   by the "Preview" feature (and subsequent "Publish" actions), and some other
  //   tables prefixed with `payload-*` are system locks.
  const payloadSystemSlugs = allPayloadCollections.filter(
    (slug) =>
      slug.startsWith("payload-") ||
      (slug.startsWith("_") && slug.endsWith("_versions")),
  );

  const payloadManifest = {
    physical: physicalCollections,
    payload: allPayloadCollections,
    internal: payloadSystemSlugs,
    wca: userDeclaredSlugs,
  };

  return NextResponse.json(payloadManifest, { status: 200 });
}
