#!/usr/bin/env bash
#
# Creates the "payload" component that Payload CMS content is translated in.
#
#   ./weblate/seed-payload.sh
#
# Unlike the `locales` component (which translates config/locales/*.yml straight
# out of git), Payload content lives in MongoDB. There is no repository to point
# at, so this component uses Weblate's own local VCS and the strings are pushed
# in over the API by next-frontend's weblate sync (src/lib/translate/sync.ts).
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/docker-compose.yml"
WEBLATE_URL="${WEBLATE_URL:-http://localhost:8080}"

dc() { docker compose -f "$COMPOSE_FILE" "$@"; }

# WEBLATE_ENABLE_HTTPS=1 turns on Django's SECURE_SSL_REDIRECT, so a plain-HTTP
# request to localhost is answered with a 301 to https://localhost, which has
# nothing listening. Asserting the header the load balancer sends makes these
# calls work from the box; it is a no-op against an https:// WEBLATE_URL.
PROXY_HEADER="X-Forwarded-Proto: https"

health="$(curl -sS -o /dev/null -w '%{http_code}' -H "$PROXY_HEADER" \
  "${WEBLATE_URL}/healthz/" 2>/dev/null || true)"
case "$health" in
  200) ;;
  3*)
    echo "Weblate redirected the health check (HTTP ${health}) at ${WEBLATE_URL}." >&2
    echo "It is running, but SECURE_SSL_REDIRECT is rejecting plain HTTP. Either set" >&2
    echo "WEBLATE_SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https in the" >&2
    echo "environment file, or re-run against the public URL:" >&2
    echo "  WEBLATE_URL=https://translate.worldcubeassociation.org $0" >&2
    exit 1
    ;;
  *)
    echo "Weblate is not responding at ${WEBLATE_URL} (HTTP ${health}). Start it with:" >&2
    echo "  docker compose -f ${COMPOSE_FILE} up -d" >&2
    exit 1
    ;;
esac

if [ -z "${WEBLATE_TOKEN:-}" ]; then
  echo "==> Fetching admin API token"
  WEBLATE_TOKEN="$(dc exec -T weblate weblate shell -c '
from weblate.auth.models import User
from rest_framework.authtoken.models import Token
u = User.objects.get(username="admin")
token, _ = Token.objects.get_or_create(user=u)
print(token.key)
' 2>/dev/null | tr -d '\r' | tail -n1)"
fi

if [ -z "${WEBLATE_TOKEN:-}" ]; then
  echo "Could not read the admin API token. Get it from" >&2
  echo "  ${WEBLATE_URL}/accounts/profile/#api" >&2
  echo "and re-run with WEBLATE_TOKEN=wlu_xxx" >&2
  exit 1
fi

# Status is checked explicitly rather than relying on `curl -f`, which only
# fails on 4xx/5xx: a 301 exits 0 with an empty body, so the call would look
# like it succeeded while creating nothing.
post() {
  local path="$1"; shift
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "${WEBLATE_URL}/api${path}" \
    -H "Authorization: Token ${WEBLATE_TOKEN}" -H "$PROXY_HEADER" "$@" 2>/dev/null || echo 000)"
  case "$code" in
    2*) return 0 ;;
    3*)
      echo "Weblate redirected POST ${path} (HTTP ${code})." >&2
      echo "That usually means SECURE_SSL_REDIRECT is on and this request was plain HTTP." >&2
      echo "Re-run against the public URL instead:" >&2
      echo "  WEBLATE_URL=https://translate.worldcubeassociation.org $0" >&2
      exit 1
      ;;
    *) return 1 ;;
  esac
}

echo "==> Creating project 'wca' (no-op if it exists)"
post /projects/ \
  -H "Content-Type: application/json" \
  -d '{"name":"WCA","slug":"wca","web":"https://www.worldcubeassociation.org/"}' \
  || echo "    (project already exists, continuing)"

# Weblate needs a source file to create a component, but the real strings arrive
# over the API on the first sync. This placeholder is replaced wholesale by the
# `method=replace` upload in pushSource().
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo '{"_placeholder": "Replaced on the first weblate sync run."}' > "$TMP/en.json"

# file_format MUST be flat "json", not "json-nested": the keys are dotted paths
# like `home#64f2:blocks(TextCard)[abc].body#0.1.0`, and json-nested would split
# them on every dot into a tree that no longer round-trips.
#
# vcs=local / repo=local: gives Weblate an internal git repo it manages itself,
# so there is no external repository of generated JSON to keep in sync.
echo "==> Creating component 'payload'"
post /projects/wca/components/ \
  -F name="Payload CMS" \
  -F slug=payload \
  -F vcs=local \
  -F repo=local: \
  -F file_format=json \
  -F filemask='payload/*.json' \
  -F template='payload/en.json' \
  -F edit_template=false \
  -F new_lang=add \
  -F language_code_style=linux \
  -F license="GPL-3.0-or-later" \
  -F docfile=@"$TMP/en.json" \
  || echo "    (component already exists, continuing)"

cat <<EOF

Done: ${WEBLATE_URL}/projects/wca/payload/

Next, push the real strings in from next-frontend. Put these in
next-frontend/.env — without WEBLATE_TOKEN the sync is a no-op:

  WEBLATE_URL=${WEBLATE_URL}
  WEBLATE_TOKEN=${WEBLATE_TOKEN}
  WEBLATE_PROJECT=wca
  WEBLATE_COMPONENT=payload

Then, from next-frontend/:

  # first run only — copies translations already in Payload up to Weblate
  yarn payload run scripts/weblate-sync.ts seed

  # afterwards, and on a schedule
  yarn payload run scripts/weblate-sync.ts

Editing content in Payload also triggers a sync via the afterChange hook.
EOF
