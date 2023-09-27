#!/bin/sh

# Download the RDS ca
curl -o https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem /etc/phpmyadmin/rds_ca.pem

# Execute the original entrypoint script with its CMD
exec /docker-entrypoint.sh "$@"
