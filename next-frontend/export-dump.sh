#!/bin/sh
apk add mongodb-tools aws-cli zip
mongodump --ssl --sslCAFile ./global-bundle.pem --uri $DATABASE_URI --authenticationMechanism MONGODB_AWS ----authenticationDatabase '$external'
zip -r dump.zip dump
aws s3 cp dump.zip s3://assets.worldcubeassociation.org/export/payload/dump.zip
