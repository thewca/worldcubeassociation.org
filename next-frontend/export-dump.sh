#!/bin/sh

# The `$DATABASE_URI` comes from the NextJS runtime (it's what the real deal Payload connects to)
#   and it already contains/specifies a specific DB within the URL. So specifying --db again is not necessary.
# The tables which are being excluded are from BetterAuth's table scheme. We only care about the actual
#   `Users` collection, everything else is about sessions which are existing or have existed on production.
#   Excluding them is safe because after importing a dump, BetterAuth will simply conclude "no users have ever
#   logged in to this service", which is a (rare but) perfectly valid state and also secure for a public-facing upload.
# The table (aka collection) names come from https://better-auth.com/docs/concepts/database#core-schema,
#   except that our Payload <-> BetterAuth adapter pluralizes them
mongodump \
  --ssl \
  --sslCAFile ./global-bundle.pem \
  --uri $DATABASE_URI \
  --authenticationMechanism MONGODB-AWS \
  --authenticationDatabase '$external' \
  --excludeCollection 'users' \
  --excludeCollection 'sessions' \
  --excludeCollection 'accounts' \
  --excludeCollection 'verifications'

# zip and upload to a point where our CDN can find it
zip -r dump.zip dump
aws s3 cp dump.zip s3://assets.worldcubeassociation.org/export/payload/dump.zip
