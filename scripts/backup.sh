#!/usr/bin/env bash

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

tarsnap -c -f wca-backup-`date +"%Y%m%d_%H%M%S"` $SECRETS_FOLDER
