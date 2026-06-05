#!/bin/bash
set -e

# Download media files from CDN to local directory for dev environment
# Usage: ./download-media.sh [--clean]
#
# This script queries the local Payload MongoDB for media filenames,
# then downloads each file from the public CDN to ./media/ so that
# Payload's local API route /api/payload/media/file/... can serve them.

trap 'echo ""; echo "Error: Command failed at line $LINENO: $BASH_COMMAND"; exit 1' ERR

# Configuration
CONTAINER_NAME="payload_db"
MONGO_USER="root"
MONGO_PASS="root"
MONGO_AUTH_DB="admin"
MONGO_DB="payload"
CDN_BASE="https://assets-nextjs.worldcubeassociation.org"
CDN_PREFIX="media"

# Resolve script directory to ensure we operate from next-frontend root
# regardless of where the script is invoked from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_MEDIA_DIR="$SCRIPT_DIR/media"
CLEAN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --clean)
      CLEAN=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--clean]"
      echo ""
      echo "Download media files from CDN to local directory."
      echo ""
      echo "Options:"
      echo "  --clean        Remove local media directory before downloading"
      echo "  -h, --help     Show this help message"
      echo ""
      echo "Requires: docker, mongosh (via container), wget or curl"
      echo "Queries MongoDB in container '$CONTAINER_NAME' for filenames,"
      echo "then downloads from $CDN_BASE/$CDN_PREFIX/{filename} to $LOCAL_MEDIA_DIR/"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information."
      exit 1
      ;;
  esac
done

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Error: Container '$CONTAINER_NAME' is not running."
  echo ""
  echo "Start it with:"
  echo "  docker-compose up -d wca_payload_db"
  exit 1
fi

if [ "$CLEAN" = true ]; then
  echo "==> Cleaning local media directory..."
  rm -rf "$LOCAL_MEDIA_DIR"
fi

echo "==> Creating media directory..."
mkdir -p "$LOCAL_MEDIA_DIR"

echo "==> Querying MongoDB for media filenames..."
# Query media collection for filenames
# Payload stores files with 'filename' field in the media collection
FILENAMES=$(docker exec "$CONTAINER_NAME" mongosh "mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB?authSource=$MONGO_AUTH_DB" --quiet --eval '
  db.media.find({}, {filename: 1, _id: 0}).toArray().map(d => d.filename).filter(f => f).join("\n")
' | tr -d '\r')

if [ -z "$FILENAMES" ]; then
  echo "Warning: No filenames found in database. Did you run import-dump.sh?"
  echo "If the collection uses a different field name, check with:"
  echo "  docker exec $CONTAINER_NAME mongosh ... --eval 'db.media.findOne()'"
  exit 0
fi

COUNT=$(echo "$FILENAMES" | wc -l | tr -d ' ')
echo "==> Found $COUNT media files to download"
echo "    Source: $CDN_BASE/$CDN_PREFIX/"
echo "    Destination: $LOCAL_MEDIA_DIR/"
echo ""

# Download each file
DOWNLOADED=0
SKIPPED=0
FAILED=0

# Choose download tool
if command -v wget >/dev/null 2>&1; then
  DOWNLOAD_CMD="wget -q -O"
elif command -v curl >/dev/null 2>&1; then
  DOWNLOAD_CMD="curl -s -o"
else
  echo "Error: Neither wget nor curl found. Install one to proceed."
  exit 1
fi

while IFS= read -r filename; do
  if [ -z "$filename" ]; then
    continue
  fi

  # Skip if already exists and not empty
  if [ -f "$LOCAL_MEDIA_DIR/$filename" ] && [ -s "$LOCAL_MEDIA_DIR/$filename" ]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  URL="$CDN_BASE/$CDN_PREFIX/$filename"
  DEST="$LOCAL_MEDIA_DIR/$filename"

  # Create subdirectory if filename contains path
  mkdir -p "$(dirname "$DEST")"

  if $DOWNLOAD_CMD "$DEST" "$URL" 2>/dev/null; then
    DOWNLOADED=$((DOWNLOADED + 1))
    # Progress indicator every 10 files
    if [ $((DOWNLOADED % 10)) -eq 0 ]; then
      echo "  Downloaded $DOWNLOADED/$COUNT..."
    fi
  else
    FAILED=$((FAILED + 1))
    echo "  Failed: $filename (URL: $URL)"
    rm -f "$DEST"
  fi
done <<< "$FILENAMES"

echo ""
echo "✓ Media download complete!"
echo "  Downloaded: $DOWNLOADED"
echo "  Skipped (already exists): $SKIPPED"
echo "  Failed: $FAILED"
echo ""
echo "Files are in $LOCAL_MEDIA_DIR/"
echo "Payload will serve them at /api/payload/media/file/{filename}"
