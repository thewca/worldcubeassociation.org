#!/bin/bash

# Make sure all sources are up-to-date
apt-get update -qq

# Install the packages from a line-separated package list,
#   making sure that one failure doesn't affect the other packages.
for pkg in $(cat "$@"); do
  apt-get install --no-install-recommends -y "$pkg";
done
