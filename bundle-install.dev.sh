#!/bin/bash

# Get the installed Ruby version from the runtime
RUBY_VERSION=$(ruby -e 'puts RUBY_VERSION')

# Set the versioned bundle path based on the Ruby version
BUNDLE_PATH="/usr/local/bundle/${RUBY_VERSION}"

# Create the versioned directory if it doesn't exist
mkdir -p "$BUNDLE_PATH"

CURRENT_SYMLINK="/usr/local/bundle/current"

# Check if the 'current' symlink exists
if [ -L "$CURRENT_SYMLINK" ]; then
  # Read the target of the 'current' symlink
  CURRENT_TARGET=$(readlink "$CURRENT_SYMLINK")

  # If the target doesn't match the current Ruby version, remove the old target
  if [[ "$CURRENT_TARGET" != "$BUNDLE_PATH" ]]; then
    echo "Removing gems for old Ruby version: $CURRENT_TARGET"
    rm -rf "$CURRENT_TARGET"
  fi
fi

# Symlink the versioned directory to a common 'current' path
ln -sfn "$BUNDLE_PATH" "$CURRENT_SYMLINK"
