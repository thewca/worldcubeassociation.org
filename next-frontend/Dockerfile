# syntax=docker.io/docker/dockerfile:1

FROM node:24-alpine AS base

FROM base AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# NewRelic v12 does not bundle Alpine-compatible binaries anymore. So they have to be built from scratch.
#   See https://github.com/newrelic/node-native-metrics?tab=readme-ov-file#musl-libc-systems for details.
RUN apk add g++ make py3-pip

RUN apk add --update --virtual .deps --no-cache unzip && \
     wget https://releases.hashicorp.com/vault/1.19.5/vault_1.19.5_linux_amd64.zip && \
    unzip vault_1.19.5_linux_amd64.zip -d /tmp && \
    mv /tmp/vault /usr/local/bin/vault && \
    rm -f vault_1.19.5_linux_amd64.zip && \
    apk del .deps

WORKDIR /app

COPY package.json yarn.lock* .yarnrc.yml ./
COPY src/theme.ts ./src/theme.ts
RUN corepack enable
RUN yarn install --immutable

# Documentdb cert
RUN wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O ./global-bundle.pem

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
# Create the types and build
RUN LOCALE_DIR="./src/lib/i18n/locales" yarn run build:translations
RUN yarn types:openapi
RUN NODE_ENV=production IS_COMPILING_ASSETS=1 NEXT_PUBLIC_WCA_FRONTEND_API_URL='https://www.worldcubeassociation.org/api/' yarn run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1
# As per https://authjs.dev/getting-started/deployment#docker
ENV AUTH_TRUST_HOST=true
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=deps /app/global-bundle.pem /app/global-bundle.pem
COPY --from=deps /usr/local/bin/vault /usr/local/bin/vault
COPY --from=builder /app/docker-entrypoint.sh /app/docker-entrypoint.sh
COPY --from=builder /app/export-dump.sh /app/export-dump.sh

RUN apk add --no-cache jq

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NEW_RELIC_APP_NAME='next-js-production'
ENV NEW_RELIC_LOG='stdout'

COPY --from=builder /app/node_modules/newrelic /app/node_modules/newrelic

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS='-r newrelic'
ENTRYPOINT ["/app/docker-entrypoint.sh"]
