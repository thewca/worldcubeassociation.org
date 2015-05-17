#!/usr/bin/env bash

cd "$(dirname "$0")"/..
print_usage_and_exit() {
  echo "Usage: $0"
  echo "Download secrets from worldcubeassociation.org needed for provisioning a new server."
  exit
}
if [ $# -gt 0 ]; then
  print_usage_and_exit
fi

# Download secrets from production site.
# TODO - eventually we'll need to look at /secrets on the production server
echo "Downloading secrets..."
rsync -a --info=progress2 cubing@worldcubeassociation.org:/home/cubing/worldcubeassociation.org/secrets/ secrets
