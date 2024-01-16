#!/bin/sh

# Download the RDS ca
curl https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem -o /etc/phpmyadmin/rds_ca.pem

# Execute the original entrypoint script with its CMD
exec /docker-entrypoint.sh "$@"
