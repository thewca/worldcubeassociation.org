#!/usr/bin/env bash

# Exit on error
set -e

cd "$(dirname "$0")"/..
SECRETS_FOLDER=secrets/
print_usage_and_exit() {
  echo "Usage: $0"
  echo "Back up secrets folder (`readlink -f $SECRETS_FOLDER`) snap"
  exit
}
if [ $# -gt 0 ]; then
  print_usage_and_exit
fi

# We are using a versioned S3 Buckets to host our backups so one sync is enough
aws sync $SECRETS_FOLDER s3://wca-backups/latest/
