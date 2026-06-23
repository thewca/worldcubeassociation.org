#!/bin/bash
set -e

# Error handling with useful messages for critical commands
trap 'echo ""; echo "Error: Command failed at line $LINENO: $BASH_COMMAND"; echo "Check that the container is running and has network access."; exit 1' ERR

# Configuration
CONTAINER_NAME="payload_db"
DUMP_URL="https://assets.worldcubeassociation.org/export/payload/dump.zip"
WORK_DIR=""
MONGO_USER="root"
MONGO_PASS="root"
MONGO_AUTH_DB="admin"

# Parse flags
FORCE_CONTAINER=false
FORCE_LOCAL=false
CLEAN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force-container)
      FORCE_CONTAINER=true
      shift
      ;;
    --force-local)
      FORCE_LOCAL=true
      shift
      ;;
    --clean)
      CLEAN=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--force-container|--force-local] [--clean]"
      echo ""
      echo "Import CMS data into the local Payload MongoDB instance."
      echo ""
      echo "Options:"
      echo "  --force-container Force execution via docker exec inside the container"
      echo "  --force-local     Force direct execution without docker exec (when already inside container)"
      echo "  --clean           Remove downloaded files after import"
      echo "  -h, --help        Show this help message"
      echo ""
      echo "The script auto-detects whether it's running on the host or inside"
      echo "a container. On the host, it uses 'docker exec' to run all operations"
      echo "inside the '$CONTAINER_NAME' container."
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information."
      exit 1
      ;;
  esac
done

if [ "$FORCE_CONTAINER" = true ] && [ "$FORCE_LOCAL" = true ]; then
  echo "Error: --force-container and --force-local cannot be used together."
  exit 1
fi

# Detect execution context
is_inside_container() {
  [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null || [ "$FORCE_LOCAL" = true ]
}

is_on_host() {
  [ "$FORCE_CONTAINER" = true ] || ! is_inside_container
}

# Core import logic (runs inside container)
run_import() {
  echo "==> Setting up work directory..."
  WORK_DIR=$(mktemp -d /tmp/cms-import.XXXXXX) || {
    echo "Error: Failed to create temporary work directory."
    exit 1
  }
  cd "$WORK_DIR"

  echo "==> Downloading CMS dump from $DUMP_URL..."
  wget -q --show-progress "$DUMP_URL" -O dump.zip || {
    echo "Error: Failed to download CMS dump. Check network connectivity and URL."
    exit 1
  }

  echo "==> Extracting dump..."
  unzip -q dump.zip || {
    echo "Error: Failed to extract dump.zip. The file may be corrupted."
    exit 1
  }

  echo "==> Processing metadata files (removing storageEngine)..."
  cd dump
  for directory in *; do
    if [ -d "${directory}" ]; then
      for metadata_file in "$directory"/*.metadata.json; do
        if [ -f "$metadata_file" ]; then
          echo "  Processing $metadata_file"
          jq 'del(.options.storageEngine)' "$metadata_file" > "$metadata_file.tmp" || {
            echo "Error: Failed to process $metadata_file with jq. Check JSON validity."
            exit 1
          }
          mv "$metadata_file.tmp" "$metadata_file"
        fi
      done
    fi
  done
  cd ..

  echo "==> Restoring to MongoDB (this may take a moment)..."
  mongorestore --drop --host=localhost --username="$MONGO_USER" --password="$MONGO_PASS" --authenticationDatabase="$MONGO_AUTH_DB" dump/ || {
    echo "Error: mongorestore failed. Check that MongoDB is running and credentials are correct."
    echo "Expected credentials: username='$MONGO_USER', authDB='$MONGO_AUTH_DB'"
    exit 1
  }

  if [ "$CLEAN" = true ]; then
    echo "==> Cleaning up..."
    rm -rf "$WORK_DIR"
  else
    echo "==> Dump files kept at $WORK_DIR (use --clean to remove automatically)"
  fi

  echo ""
  echo "✓ CMS data import complete!"
  echo "  Restart your Next.js dev server if it's already running to pick up the new content."
}

# Main execution
if is_on_host; then
  echo "Detected host environment. Running import inside '$CONTAINER_NAME' container via docker exec..."
  echo ""

  # Check if container is running
  if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container '$CONTAINER_NAME' is not running."
    echo ""
    echo "Start it with:"
    echo "  docker compose up -d wca_payload_db"
    echo ""
    echo "Or start the full stack:"
    echo "  docker compose up -d"
    exit 1
  fi

  # Check if container is healthy
  CONTAINER_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no-healthcheck")
  if [ "$CONTAINER_STATUS" = "starting" ]; then
    echo "Waiting for MongoDB to be ready..."
    for i in {1..30}; do
      CONTAINER_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no-healthcheck")
      if [ "$CONTAINER_STATUS" = "healthy" ] || [ "$CONTAINER_STATUS" = "no-healthcheck" ]; then
        break
      fi
      sleep 1
    done
  fi

  if [ "$CONTAINER_STATUS" != "healthy" ] && [ "$CONTAINER_STATUS" != "no-healthcheck" ]; then
    echo "Warning: Container '$CONTAINER_NAME' health status is '$CONTAINER_STATUS'. Proceeding anyway..."
  fi

  # Build the command to run inside container
  # Pass through flags
  CONTAINER_ARGS=""
  [ "$CLEAN" = true ] && CONTAINER_ARGS="$CONTAINER_ARGS --clean"
  CONTAINER_ARGS="$CONTAINER_ARGS --force-local"

  # Copy this script into container and execute it
  SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
  docker cp "$SCRIPT_PATH" "$CONTAINER_NAME:/tmp/import-dump.sh"
  docker exec "$CONTAINER_NAME" bash /tmp/import-dump.sh $CONTAINER_ARGS

else
  echo "Detected container environment. Running import directly..."
  echo ""
  run_import
fi
