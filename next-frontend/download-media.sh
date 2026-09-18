#!/bin/bash
set -e

# Download media files from CDN into the Next.js dev media directory.
# Usage: ./download-media.sh [--clean]
#
# The media directory (next-frontend/media) is bind-mounted into the
# 'nextjs' container at /app/media and is owned by root (the container
# user), so it is not writable from the host. We therefore run the
# downloads *inside* the 'nextjs' container, and query the Payload
# MongoDB for filenames via the 'payload_db' container. The files land
# in next-frontend/media so Payload can serve them at
# /api/payload/media/file/{filename}.

trap 'echo ""; echo "Error: Command failed at line $LINENO: $BASH_COMMAND"; exit 1' ERR

# Configuration
DB_CONTAINER="payload_db"
NEXTJS_CONTAINER="nextjs"
CONTAINER_MEDIA_DIR="/app/media"
MONGO_USER="root"
MONGO_PASS="root"
MONGO_AUTH_DB="admin"
MONGO_DB="payload"
CDN_BASE="https://assets-nextjs.worldcubeassociation.org"
CDN_PREFIX="media"

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
      echo "Download media files from the CDN into the Next.js media directory."
      echo ""
      echo "Options:"
      echo "  --clean        Remove the media directory contents before downloading"
      echo "  -h, --help     Show this help message"
      echo ""
      echo "Requires the '$DB_CONTAINER' and '$NEXTJS_CONTAINER' containers to be running."
      echo "Queries MongoDB in '$DB_CONTAINER' for filenames, then downloads from"
      echo "$CDN_BASE/$CDN_PREFIX/{filename} into $CONTAINER_MEDIA_DIR inside '$NEXTJS_CONTAINER'."
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information."
      exit 1
      ;;
  esac
done

# Check required containers are running
for container in "$DB_CONTAINER" "$NEXTJS_CONTAINER"; do
  if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "Error: Container '$container' is not running."
    echo ""
    echo "Start the stack with:"
    echo "  docker compose up -d"
    exit 1
  fi
done

if [ "$CLEAN" = true ]; then
  echo "==> Cleaning media directory ($CONTAINER_MEDIA_DIR in '$NEXTJS_CONTAINER')..."
  docker exec "$NEXTJS_CONTAINER" bash -c 'rm -rf "'"$CONTAINER_MEDIA_DIR"'"/*'
fi

echo "==> Querying MongoDB for media filenames..."
# Payload stores files with a 'filename' field in the media collection
FILENAMES=$(docker exec "$DB_CONTAINER" mongosh "mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB?authSource=$MONGO_AUTH_DB" --quiet --eval '
  db.media.find({}, {filename: 1, _id: 0}).toArray().map(d => d.filename).filter(f => f).join("\n")
' | tr -d '\r')

if [ -z "$FILENAMES" ]; then
  echo "Warning: No filenames found in database. Did you run import-dump.sh?"
  echo "If the collection uses a different field name, check with:"
  echo "  docker exec $DB_CONTAINER mongosh ... --eval 'db.media.findOne()'"
  exit 0
fi

COUNT=$(echo "$FILENAMES" | wc -l | tr -d ' ')
echo "==> Found $COUNT media files to download"
echo "    Source: $CDN_BASE/$CDN_PREFIX/"
echo "    Destination: $CONTAINER_MEDIA_DIR/ (inside '$NEXTJS_CONTAINER')"
echo ""

# Download loop runs inside the nextjs container, which owns the media mount.
# Config and the filename list are passed via environment variables so stdin
# stays free for the read loop.
INNER_SCRIPT='
set -u

# Percent-encode a path for use in a URL, preserving "/" path separators.
urlencode_path() {
  local s="$1" out="" i c
  for (( i=0; i<${#s}; i++ )); do
    c="${s:i:1}"
    case "$c" in
      [a-zA-Z0-9._~/-]) out+="$c" ;;
      *) printf -v c "%%%02X" "'"'"'$c"; out+="$c" ;;
    esac
  done
  printf "%s" "$out"
}

mkdir -p "$MEDIA_DIR"
DOWNLOADED=0; SKIPPED=0; FAILED=0
while IFS= read -r filename; do
  [ -z "$filename" ] && continue

  dest="$MEDIA_DIR/$filename"
  if [ -s "$dest" ]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  url="$CDN_BASE/$CDN_PREFIX/$(urlencode_path "$filename")"
  mkdir -p "$(dirname "$dest")"

  http_code=$(curl -sS -L --globoff -w "%{http_code}" -o "$dest" "$url" 2>/tmp/dl_err)
  rc=$?
  if [ "$rc" -ne 0 ]; then
    FAILED=$((FAILED + 1))
    echo "  Failed: $filename (curl error: $(tr "\n" " " < /tmp/dl_err)) (URL: $url)"
    rm -f "$dest"
  elif [ "$http_code" -ge 400 ]; then
    FAILED=$((FAILED + 1))
    echo "  Failed: $filename (HTTP $http_code) (URL: $url)"
    rm -f "$dest"
  else
    DOWNLOADED=$((DOWNLOADED + 1))
    if [ $((DOWNLOADED % 10)) -eq 0 ]; then
      echo "  Downloaded $DOWNLOADED/$COUNT..."
    fi
  fi
done <<< "$FILENAMES"

echo ""
echo "Done. Downloaded: $DOWNLOADED  Skipped: $SKIPPED  Failed: $FAILED"
'

docker exec \
  -e FILENAMES="$FILENAMES" \
  -e COUNT="$COUNT" \
  -e CDN_BASE="$CDN_BASE" \
  -e CDN_PREFIX="$CDN_PREFIX" \
  -e MEDIA_DIR="$CONTAINER_MEDIA_DIR" \
  "$NEXTJS_CONTAINER" bash -c "$INNER_SCRIPT"

echo ""
echo "✓ Media download complete!"
echo "Files are in next-frontend/media/ (mounted at $CONTAINER_MEDIA_DIR)"
echo "Payload will serve them at /api/payload/media/file/{filename}"
