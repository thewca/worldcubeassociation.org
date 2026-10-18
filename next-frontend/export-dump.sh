#!/bin/sh
set -e

# The tables which are being excluded are from BetterAuth's table scheme. We only care about the actual
#   `Users` collection, everything else is about sessions which are existing or have existed on production.
#   Excluding them is safe because after importing a dump, BetterAuth will simply conclude "no users have ever
#   logged in to this service", which is a (rare but) perfectly valid state and also secure for a public-facing upload.
# The table (aka collection) names come from https://better-auth.com/docs/concepts/database#core-schema,
#   except that our Payload <-> BetterAuth adapter pluralizes them
CONFIDENTIAL_EXCLUDE="users accounts sessions verifications"

echo "🛡️ Auditing physical database against build-time schema manifest..."

# Read the schema manifest that we generated at build time
#   During the lifetime of one NextJS build, the Payload schema never changes.
#   Installing a new plugin, adding a new collection or a new global all require
#   running a new Docker build (and deployment), which generates a new manifest.
MANIFEST_FILE="./payload-schema-manifest.json"

# Need to pull the credentials for being able to access the manifest in the first place
vault login -method=aws role="$TASK_ROLE" region=us-west-2
PAYLOAD_MANIFEST_PASSWORD=$(vault read -field=data -format=json kv/data/"$VAULT_APPLICATION"/PAYLOAD_MANIFEST_PASSWORD | jq -r '.value')

wget --header "x-manifest-secret: $PAYLOAD_MANIFEST_PASSWORD" -O "$MANIFEST_FILE" "localhost:3000/api/payload/schema-manifest"

PHYSICAL_COLLECTIONS=$(jq -c '.physical' "$MANIFEST_FILE")
PAYLOAD_COLLECTIONS=$(jq -c '.payload' "$MANIFEST_FILE")

# Are there any tables inside MongoDB, which Payload doesn't know about *at all*
#   (even considering plugins and internal Payload schema management tables)?
UNMANAGED_COLLECTIONS=$(jq -n \
  --argjson physical "$PHYSICAL_COLLECTIONS" \
  --argjson payload "$PAYLOAD_COLLECTIONS" \
  '$physical - $payload')

UNMANAGED_COUNT=$(echo "$UNMANAGED_COLLECTIONS" | jq 'length')

if [ "$UNMANAGED_COUNT" -gt 0 ]; then
  echo "❌ DATABASE AUDIT FAILED: Found physical tables in MongoDB unknown to Payload:"
  echo "$UNMANAGED_COLLECTIONS" | jq -r '.[] | " - \(.)"'
  echo "Aborting dump."
  exit 1
fi

# Are there any Payload tables which are neither...
#   1. declared by ourselves in our config file tree as collection or global (fine to dump)
#   2. schema management internals by Payload
#   3. flagged as being excluded from the dump (see $CONFIDENTIAL_EXCLUDE above)
# Then we have a problem. Imagine for example that BetterAuth adds a confidential table
#   via plugin schema introspection one day. It will not be declared by us, it will not be Payload-internal
#   and it will not be part of the $CONFIDENTIAL_EXCLUDE above (until we consciously, manually add it)
#   so the schema dump will abort in that case and remind us to think about adding the table to the excludes.
WCA_COLLECTIONS=$(jq -c '.wca' "$MANIFEST_FILE")
INTERNAL_COLLECTIONS=$(jq -c '.internal' "$MANIFEST_FILE")
EXCLUDES_COLLECTIONS=$(echo "$CONFIDENTIAL_EXCLUDE" | jq -R 'split(" ")')

UNCLASSIFIED_COLLECTIONS=$(jq -n \
  --argjson payload "$PAYLOAD_COLLECTIONS" \
  --argjson wca "$WCA_COLLECTIONS" \
  --argjson internal "$INTERNAL_COLLECTIONS" \
  --argjson excludes "$EXCLUDES_COLLECTIONS" \
  '$payload - $wca - $internal - $excludes')

UNCLASSIFIED_COUNT=$(echo "$UNCLASSIFIED_COLLECTIONS" | jq 'length')

if [ "$UNCLASSIFIED_COUNT" -gt 0 ]; then
  echo "❌ DATABASE AUDIT FAILED: Found Payload tables which are not managed by us or excluded explicitly:"
  echo "$UNCLASSIFIED_COLLECTIONS" | jq -r '.[] | " - \(.)"'
  echo "Consider investigating where these came from and add them to CONFIDENTIAL_EXCLUDE as appropriate."
  echo "Aborting dump."
  exit 1
fi

echo "✅ AUDIT PASSED: All database collections match the build manifest."

# 4. Build --excludeCollection flags for mongodump
EXCLUDE_FLAGS=""
for table in $CONFIDENTIAL_EXCLUDE; do
  EXCLUDE_FLAGS="$EXCLUDE_FLAGS --excludeCollection=$table"
done

echo "🚀 Starting mongodump..."

# The `$DATABASE_URI` comes from the NextJS runtime (it's what the real deal Payload connects to)
#   and it already contains/specifies a specific DB within the URL. So specifying --db again is not necessary.
mongodump \
  --ssl \
  --sslCAFile ./global-bundle.pem \
  --uri "$DATABASE_URI" \
  --authenticationMechanism MONGODB-AWS \
  --authenticationDatabase '$external' \
  $EXCLUDE_FLAGS

# zip and upload to a point where our CDN can find it
zip -r dump.zip dump
aws s3 cp dump.zip s3://assets.worldcubeassociation.org/export/payload/dump.zip
