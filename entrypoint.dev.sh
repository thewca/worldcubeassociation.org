#!/bin/bash

# Get the installed Ruby version from the runtime
RUBY_VERSION=$(ruby -e 'puts RUBY_VERSION')

# Set the versioned bundle path based on the Ruby version
BUNDLE_PATH="/usr/local/bundle/${RUBY_VERSION}"

# Create the versioned directory if it doesn't exist
mkdir -p "$BUNDLE_PATH"

# Symlink the versioned directory to a common 'current' path
ln -sfn "$BUNDLE_PATH" /usr/local/bundle/current
BUNDLE_PATH=/usr/local/bundle/current

# Set the BUNDLE_PATH to the symlink for all processes
export BUNDLE_PATH

# Run the main command (e.g., rails server or sidekiq)
exec "$@"
