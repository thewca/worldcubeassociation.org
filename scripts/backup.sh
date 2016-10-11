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

# We've been running into issues with tarsnap needed to run fsk. Rather
# than fixing these manually, we just run fsk unconditionally.
# See: https://groups.google.com/d/msg/wca-admin/u_jIaAgP6us/NkDFiHo-CgAJ.
sudo tarsnap --fsck

sudo tarsnap -c -f wca-backup-`date +"%Y%m%d_%H%M%S"` $SECRETS_FOLDER
