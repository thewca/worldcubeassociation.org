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
echo "Downloading secrets..."
rsync -a --info=progress2 cubing@worldcubeassociation.org:/home/cubing/worldcubeassociation.org/secrets/ secrets

# Download uploaded user images from production site.
echo "Downloading user images..."
rsync -a --info=progress2 cubing@worldcubeassociation.org:/home/cubing/worldcubeassociation.org/webroot/results/upload/ webroot/results/upload
