#!/bin/sh

# Download the RDS ca
curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /etc/phpmyadmin/rds_ca.pem

# Execute the original entrypoint script with its CMD
exec /docker-entrypoint.sh "$@"
