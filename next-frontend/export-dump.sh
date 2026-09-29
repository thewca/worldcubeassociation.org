#!/bin/sh
set -e

apk add mongodb-tools aws-cli zip

mongodump --ssl --sslCAFile ./global-bundle.pem --uri "$DATABASE_URI" --authenticationMechanism MONGODB-AWS --authenticationDatabase '$external'

# Better Auth keeps credentials in their own collections (Payload pluralizes the model
# names). Drop them wholesale rather than field-by-field. The list is every model in the
# plugin's `defaultSecretFieldsByModel`, so tables we do not use yet are covered too.
for collection in accounts apikeys jwks oauthAccessTokens oauthApplications sessions twoFactors verifications; do
  rm -f dump/*/"$collection".bson dump/*/"$collection".metadata.json
done

# `users` still holds real email addresses (plus embedded auth state on rows written by the
# old payload-authjs setup). NODE_OPTIONS is cleared so the New Relic agent (-r newrelic)
# is not loaded.
USERS_BSON=$(find dump -name 'users.bson' | head -n 1)
if [ -n "$USERS_BSON" ]; then
  NODE_OPTIONS='' node /app/sanitize-dump.mjs "$USERS_BSON"
else
  echo "ERROR: users.bson not found in dump; refusing to publish unsanitized export" >&2
  exit 1
fi

zip -r dump.zip dump
aws s3 cp dump.zip s3://exports.worldcubeassociation.org/payload/dump.zip
