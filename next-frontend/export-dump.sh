#!/bin/sh
set -e

apk add mongodb-tools aws-cli zip

mongodump --ssl --sslCAFile ./global-bundle.pem --uri "$DATABASE_URI" --authenticationMechanism MONGODB-AWS --authenticationDatabase '$external'

# Strip PII/secrets (user emails + embedded auth tokens) before publishing.
# NODE_OPTIONS is cleared so the New Relic agent (-r newrelic) is not loaded.
USERS_BSON=$(find dump -name 'users.bson' | head -n 1)
if [ -n "$USERS_BSON" ]; then
  NODE_OPTIONS='' node /app/sanitize-dump.mjs "$USERS_BSON"
else
  echo "ERROR: users.bson not found in dump; refusing to publish unsanitized export" >&2
  exit 1
fi

zip -r dump.zip dump
aws s3 cp dump.zip s3://assets.worldcubeassociation.org/export/payload/dump.zip