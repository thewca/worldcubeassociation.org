#!/usr/bin/env bash
#
# Creates a "wca" project in the running Weblate instance with two components
# pointed at config/locales/*.yml, so there is something real to click around in.
#
#   ./weblate/seed.sh                 # translate github.com/thewca/worldcubeassociation.org
#   REPO=file:///wca-repo ./weblate/seed.sh    # translate your local clone instead
#
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/docker-compose.yml"
WEBLATE_URL="${WEBLATE_URL:-http://localhost:8080}"
REPO="${REPO:-https://github.com/thewca/worldcubeassociation.org.git}"
BRANCH="${BRANCH:-main}"

dc() { docker compose -f "$COMPOSE_FILE" "$@"; }

# In production WEBLATE_ENABLE_HTTPS=1 turns on Django's SECURE_SSL_REDIRECT, so
# a plain-HTTP request to localhost is answered with a 301 to https://localhost,
# which has nothing listening. Asserting the same header the load balancer sends
# makes these calls work from the box; it is a no-op when WEBLATE_URL is already
# an https:// address.
PROXY_HEADER="X-Forwarded-Proto: https"

echo "==> Waiting for Weblate at ${WEBLATE_URL} (first boot runs migrations, can take a few minutes)"
for _ in $(seq 1 90); do
  code="$(curl -sS -o /dev/null -w '%{http_code}' -H "$PROXY_HEADER" \
    "${WEBLATE_URL}/healthz/" 2>/dev/null || true)"
  if [ "$code" = "200" ]; then
    ok=1
    break
  fi
  sleep 5
done
if [ "${ok:-}" != "1" ]; then
  case "${code:-}" in
    3*)
      echo "Weblate redirected the health check (HTTP ${code}) at ${WEBLATE_URL}." >&2
      echo "It is running, but SECURE_SSL_REDIRECT is rejecting plain HTTP. Either set" >&2
      echo "WEBLATE_SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https in the" >&2
      echo "environment file, or re-run against the public URL:" >&2
      echo "  WEBLATE_URL=https://translate.worldcubeassociation.org $0" >&2
      ;;
    *)
      echo "Weblate did not become healthy. Check: docker compose -f ${COMPOSE_FILE} logs weblate" >&2
      ;;
  esac
  exit 1
fi

# The REST API is the stable interface, but getting the admin's token has to go
# through the ORM once. If this breaks on a Weblate upgrade, grab the token from
# http://localhost:8080/accounts/profile/#api and re-run with WEBLATE_TOKEN=...
if [ -z "${WEBLATE_TOKEN:-}" ]; then
  echo "==> Fetching admin API token"
  WEBLATE_TOKEN="$(dc exec -T weblate weblate shell -c '
from weblate.auth.models import User
u = User.objects.get(username="admin")
token = getattr(u, "auth_token", None)
if token is None:
    from rest_framework.authtoken.models import Token
    token, _ = Token.objects.get_or_create(user=u)
print(token.key)
' 2>/dev/null | tr -d '\r' | tail -n1)"
fi

if [ -z "${WEBLATE_TOKEN:-}" ]; then
  echo "Could not read the admin API token." >&2
  echo "Get it from ${WEBLATE_URL}/accounts/profile/#api and re-run:" >&2
  echo "  WEBLATE_TOKEN=wlu_xxx ./weblate/seed.sh" >&2
  exit 1
fi

# Status is checked explicitly rather than relying on `curl -f`, which only fails
# on 4xx/5xx: a 301 exits 0 with an empty body, so every call would look like it
# succeeded while creating nothing.
#
#   2xx -> print the body, succeed
#   3xx -> hard failure; this is a misconfiguration, not "already exists"
#   4xx/5xx -> return non-zero so callers can treat it as "already exists"
api() {
  local method="$1" path="$2" data="${3:-}" body code
  body="$(mktemp)"
  code="$(curl -sS -o "$body" -w '%{http_code}' -X "$method" "${WEBLATE_URL}/api${path}" \
    -H "Authorization: Token ${WEBLATE_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "$PROXY_HEADER" \
    ${data:+--data "$data"} 2>/dev/null || echo 000)"

  case "$code" in
    2*) cat "$body"; rm -f "$body" ;;
    3*)
      rm -f "$body"
      echo "Weblate redirected ${method} ${path} (HTTP ${code})." >&2
      echo "That usually means SECURE_SSL_REDIRECT is on and this request was plain HTTP." >&2
      echo "Re-run against the public URL instead:" >&2
      echo "  WEBLATE_URL=https://translate.worldcubeassociation.org $0" >&2
      exit 1
      ;;
    *) rm -f "$body"; return 1 ;;
  esac
}

echo "==> Creating project 'wca'"
api POST /projects/ '{
  "name": "WCA",
  "slug": "wca",
  "web": "https://www.worldcubeassociation.org/"
}' >/dev/null || echo "    (project already exists, continuing)"

# Rails i18n YAML is monolingual: every file holds all keys, en.yml is the base.
#
# The filemask picks up config/locales/*.yml. Weblate's default language filter
# (^[^.]+$) drops anything with a dot in the language slot, which is exactly the
# files that are not plain locales: faker.en.yml, shared.en.yml,
# devise_overrieds.ru.yml and the time_will_tell.*.yml set. So this component
# lands on the 33 real locales and nothing else.
#
# file_format MUST be "ruby-yaml", not plain "yaml". Rails locale files are
# rooted at the locale code (`en:` in en.yml, `de:` in de.yml); ruby-yaml strips
# that root key so keys line up across files. Plain "yaml" keeps it, giving
# `en->about->x` vs `de->about->x` — 0 of 2303 keys match the template and every
# locale reads as 0% translated.
#
# The cost of ruby-yaml is that it normalizes plurals to CLDR and so drops
# Rails' non-CLDR `zero:` form on write. See README "Format choice" — the real
# blast radius is 49 strings over 3 English keys, not the 573 raw occurrences.
echo "==> Creating component 'locales' (config/locales/*.yml)"
api POST /projects/wca/components/ "$(cat <<JSON
{
  "name": "Locales",
  "slug": "locales",
  "vcs": "git",
  "repo": "${REPO}",
  "branch": "${BRANCH}",
  "file_format": "ruby-yaml",
  "filemask": "config/locales/*.yml",
  "template": "config/locales/en.yml",
  "edit_template": false,
  "language_regex": "^[^.]+$",
  "license": "GPL-3.0-or-later"
}
JSON
)" >/dev/null || echo "    (component already exists, continuing)"

# time_will_tell.*.yml is its own monolingual set with the language in a dotted
# suffix, so it needs its own filemask. Sharing the repo via weblate://wca/locales
# means it is a second component over the *same* clone, not a second 450 MB copy.
echo "==> Creating component 'time-will-tell' (config/locales/time_will_tell.*.yml)"
api POST /projects/wca/components/ '{
  "name": "Time Will Tell",
  "slug": "time-will-tell",
  "vcs": "git",
  "repo": "weblate://wca/locales",
  "file_format": "ruby-yaml",
  "filemask": "config/locales/time_will_tell.*.yml",
  "template": "config/locales/time_will_tell.en.yml",
  "edit_template": false,
  "license": "GPL-3.0-or-later"
}' >/dev/null || echo "    (component already exists, continuing)"

cat <<EOF

Done. Weblate is cloning and parsing the repo in the background — the string
counts fill in over the next few minutes.

  ${WEBLATE_URL}/projects/wca/     (log in as admin / admin)

EOF
