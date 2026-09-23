#!/bin/bash
#
# Renders environment.prod from environment.prod.template, filling the ${...}
# placeholders with secrets from SSM Parameter Store.
#
# Run at every boot by the instance user-data (see README.md), before the
# Weblate stack starts. Safe to re-run: the output is rewritten
# atomically each time.
#
#   WEBLATE_PRIVATE_IP=10.0.0.5 ./render-env.sh
#
# Requires: aws CLI, envsubst (gettext), and an instance profile with
# ssm:GetParameter on /weblate/*.

set -euo pipefail

# Defensive: the caller (user-data) runs with `set -x`, and while that does not
# inherit into this process, an accidental `bash -x render-env.sh` would print
# every secret into the cloud-init log.
set +x

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/environment.prod.template"
OUTPUT="$SCRIPT_DIR/environment.prod"
REGION="${AWS_REGION:-us-west-2}"

die() { echo "render-env: $*" >&2; exit 1; }

command -v aws >/dev/null || die "aws CLI not found"
command -v envsubst >/dev/null || die "envsubst not found (dnf install gettext)"
[ -f "$TEMPLATE" ] || die "template not found at $TEMPLATE"

# Injected by user-data from IMDS. It changes with every ASG replacement, which
# is why it cannot live in the template as a literal.
[ -n "${WEBLATE_PRIVATE_IP:-}" ] || die "WEBLATE_PRIVATE_IP is not set"

ssm() {
  aws ssm get-parameter \
    --region "$REGION" \
    --name "/weblate/$1" \
    --with-decryption \
    --query 'Parameter.Value' \
    --output text
}

echo "render-env: reading secrets from SSM (/weblate/*) in $REGION"

WEBLATE_ADMIN_PASSWORD="$(ssm admin_password)"
WEBLATE_SOCIAL_AUTH_OIDC_KEY="$(ssm oidc_key)"
WEBLATE_SOCIAL_AUTH_OIDC_SECRET="$(ssm oidc_secret)"
POSTGRES_PASSWORD="$(ssm postgres_password)"

export WEBLATE_PRIVATE_IP WEBLATE_ADMIN_PASSWORD \
  WEBLATE_SOCIAL_AUTH_OIDC_KEY WEBLATE_SOCIAL_AUTH_OIDC_SECRET \
  WEBLATE_EMAIL_HOST_USER WEBLATE_EMAIL_HOST_PASSWORD \
  WEBLATE_GITHUB_TOKEN POSTGRES_PASSWORD

REQUIRED=(
  WEBLATE_PRIVATE_IP
  WEBLATE_ADMIN_PASSWORD
  WEBLATE_SOCIAL_AUTH_OIDC_KEY
  WEBLATE_SOCIAL_AUTH_OIDC_SECRET
  WEBLATE_EMAIL_HOST_USER
  WEBLATE_EMAIL_HOST_PASSWORD
  WEBLATE_GITHUB_TOKEN
  POSTGRES_PASSWORD
)

# A missing SSM parameter must stop the boot. Without this check envsubst would
# happily write `POSTGRES_PASSWORD=` and the stack would come up in a state that
# is broken but not obviously so.
for var in "${REQUIRED[@]}"; do
  [ -n "${!var:-}" ] || die "$var resolved empty — check /weblate/* in SSM"
done

# Restrict envsubst to the names above, so any other shell-looking text in the
# template (or a value containing '$') is left untouched.
VARS="$(printf '${%s} ' "${REQUIRED[@]}")"

umask 077
TMP="$(mktemp "$OUTPUT.XXXXXX")"
trap 'rm -f "$TMP"' EXIT

envsubst "$VARS" < "$TEMPLATE" > "$TMP"

# Catches drift between the template and this script: envsubst leaves unlisted
# placeholders verbatim, so a placeholder in the template that nobody wired up
# here fails loudly instead of reaching Weblate as a literal string.
#
# One pattern, used once — matching on a looser pattern than the one that builds
# the error message produces a failure that reports nothing.
# `|| true` because grep exits non-zero when it finds nothing, which is the
# success case here and would otherwise trip `set -e` / pipefail.
LEFTOVER="$(grep -o '\${[A-Za-z_][A-Za-z0-9_]*}' "$TMP" | sort -u | tr '\n' ' ' || true)"
if [ -n "$LEFTOVER" ]; then
  die "unsubstituted placeholders remain: $LEFTOVER"
fi

chmod 600 "$TMP"
mv "$TMP" "$OUTPUT"
trap - EXIT

echo "render-env: wrote $OUTPUT ($(wc -l < "$OUTPUT") lines, mode 600)"
