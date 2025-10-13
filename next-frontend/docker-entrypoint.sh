#!/bin/sh

vault login -method=aws role="$TASK_ROLE" region=us-west-2

AUTH_SECRET=$(vault read -field=data -format=json kv/data/"$VAULT_APPLICATION"/AUTH_SECRET | jq -r '.value')
OIDC_CLIENT_ID=$(vault read -field=data -format=json kv/data/"$VAULT_APPLICATION"/OIDC_CLIENT_ID | jq -r '.value')
OIDC_CLIENT_SECRET=$(vault read -field=data -format=json kv/data/"$VAULT_APPLICATION"/OIDC_CLIENT_SECRET | jq -r '.value')
PAYLOAD_SECRET=$(vault read -field=data -format=json kv/data/"$VAULT_APPLICATION"/PAYLOAD_SECRET | jq -r '.value')
PREVIEW_SECRET=$(vault read -field=data -format=json kv/data/"$VAULT_APPLICATION"/PREVIEW_SECRET | jq -r '.value')
NEW_RELIC_LICENSE_KEY=$(vault read -field=data -format=json kv/data/"$VAULT_APPLICATION"/NEW_RELIC_LICENSE_KEY | jq -r '.value')

export AUTH_SECRET
export OIDC_CLIENT_ID
export OIDC_CLIENT_SECRET
export PAYLOAD_SECRET
export PREVIEW_SECRET
export NEW_RELIC_LICENSE_KEY

exec node server.js
