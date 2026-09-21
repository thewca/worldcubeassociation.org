#!/bin/bash
#
# Instance bootstrap for the Weblate deployment. See DEPLOYMENT.md.
#
# `@BRANCH@` is substituted before launch:
#   sed "s|@BRANCH@|$BRANCH|" weblate/user-data.sh > /tmp/weblate-user-data.sh
#
# This runs on the instance under bash, so bash syntax here is correct
# regardless of what shell you drive the AWS CLI from.
set -euxo pipefail

# gettext provides envsubst, which render-env.sh uses.
dnf install -y docker git gettext

# Amazon Linux 2023 ships Docker but NOT the Compose v2 plugin — it is not in
# the AL2023 repos and `docker compose` fails without this.
mkdir -p /usr/local/lib/docker/cli-plugins
curl -sSL https://github.com/docker/compose/releases/download/v2.40.0/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

systemctl enable --now docker

git clone --depth 1 --branch @BRANCH@ \
  https://github.com/thewca/worldcubeassociation.org /opt/wca

# ALLOWED_HOSTS must contain the private IP: ALB health checks send
# "Host: <target-ip>:8080", and Django answers 400 to any host not on the list —
# including on /healthz/ — which leaves the target permanently unhealthy while
# the application logs look completely normal.
TOKEN=$(curl -sX PUT http://169.254.169.254/latest/api/token \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 300")
PRIVATE_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/local-ipv4)

# Secrets come from SSM at boot; nothing sensitive is baked into the AMI.
AWS_REGION=us-west-2 WEBLATE_PRIVATE_IP="$PRIVATE_IP" \
  /opt/wca/weblate/render-env.sh

cd /opt/wca/weblate
docker compose -f docker-compose.prod.yml up -d
