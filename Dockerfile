FROM ruby:3.4.6 AS base
WORKDIR /rails

ENV DEBIAN_FRONTEND noninteractive

# Set production environment
# BUILD_TAG / WCA_LIVE_SITE / SHAKAPACKER_ASSET_HOST are deliberately NOT
# set here. BUILD_TAG is the git SHA (changes every commit) and the other two differ
# per environment; putting them in `base` invalidated every layer below (gems, node,
# playwright, assets) on every build. They're declared later, only where consumed.
ENV RAILS_LOG_TO_STDOUT="1" \
    RAILS_ENV="production" \
    BUNDLE_WITHOUT="development:test" \
    BUNDLE_DEPLOYMENT="1" \
    PLAYWRIGHT_BROWSERS_PATH="/rails/pw-browsers"

# Add dependencies necessary to install nodejs.
# From: https://github.com/nodesource/distributions#debian-and-ubuntu-based-distributions
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      ca-certificates \
      curl \
      gnupg

ARG NODE_MAJOR=24
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash && \
    apt-get install -y nodejs

# Make sure that both the build container *and* the runtime container know about timezones
# tzdata = making sure ActiveSupport knows which timezones currently exist
# tzdata-legacy = making sure ActiveSupport knows which timezones used to exist (argh…) cf. Kiev <-> Kyiv or Katmandu <-> Kathmandu
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      tzdata \
      tzdata-legacy

FROM base AS build

# Enable 'corepack' feature that lets NPM download the package manager on-the-fly as required.
RUN corepack enable

# Install native dependencies for Ruby:
# libvips = image processing for Rails ActiveStorage attachments
# libssl-dev = bindings for the native extensions of Ruby SSL gem
# libyaml-dev = bindings for the native extensions of Ruby psych gem
# libclang-dev and cargo = Rust compiler toolchain for Ruby gems that have external Rust bindings
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      git \
      libclang-dev \
      cargo \
      pkg-config \
      libssl-dev \
      libyaml-dev

COPY bin ./bin

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN gem update --system && gem install bundler

RUN bundle config set --local path /rails/.cache/bundle

# Use a cache mount to reuse old gems
RUN --mount=type=cache,sharing=private,target=/rails/.cache/bundle \
  mkdir -p vendor && \
  bundle install && \
  cp -ar /rails/.cache/bundle vendor/bundle && \
  bundle config set path vendor/bundle

# Install node dependencies
COPY package.json yarn.lock .yarnrc.yml ./
RUN ./bin/yarn install --immutable

# Install Playwright browser executables. The target folder after the final cp
#   matches the destination defined by $PLAYWRIGHT_BROWSERS_PATH above.
RUN --mount=type=cache,sharing=private,target=/rails/.cache/pw-browsers \
  PLAYWRIGHT_BROWSERS_PATH="/rails/.cache/pw-browsers" ./bin/yarn playwright install --no-shell chromium && \
  cp -ar /rails/.cache/pw-browsers pw-browsers

COPY . .

# Volatile / per-environment args, declared as late as possible so the gem, node and
# playwright install layers above stay cached across commits and shared across envs.
ARG BUILD_TAG=local
ARG WCA_LIVE_SITE
ARG SHAKAPACKER_ASSET_HOST
ENV BUILD_TAG=$BUILD_TAG \
    WCA_LIVE_SITE=$WCA_LIVE_SITE \
    SHAKAPACKER_ASSET_HOST=$SHAKAPACKER_ASSET_HOST

RUN ASSETS_COMPILATION=true SECRET_KEY_BASE=1 RAILS_MAX_THREADS=4 NODE_OPTIONS="--max_old_space_size=4096" ./bin/i18n export
RUN --mount=type=cache,uid=1000,target=/rails/tmp/cache ASSETS_COMPILATION=true SECRET_KEY_BASE=1 RAILS_MAX_THREADS=4 NODE_OPTIONS="--max_old_space_size=4096" ./bin/rake assets:precompile

# Save the Playwright CLI from certain doom
RUN mkdir -p "$PLAYWRIGHT_BROWSERS_PATH/node_modules"
RUN cp -r node_modules/playwright* "$PLAYWRIGHT_BROWSERS_PATH/node_modules"

RUN rm -rf node_modules

FROM base AS runtime

# Install fonts for rendering PDFs (mostly competition summary PDFs)
#   as well as native runtime dependencies for Ruby:
# dejavu = Hebrew, Arabic, Greek
# unfonts-core = Korean
# wqy-modern = Chinese
# ipafont = Japanese
# thai-tlwg = Thai (as the name suggests)
# lmodern = Random accents and special symbols for Latin script
# RUNTIME STUFF
# mariadb-client = talking to our database in production mode
# imagemagick = image processing for Rails ActiveStorage attachments
# libvips = image processing for Rails ActiveStorage attachments
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      mariadb-client \
      imagemagick \
      libvips \
      zip \
      python-is-python3 \
      fonts-dejavu \
      fonts-unfonts-core \
      fonts-wqy-microhei \
      fonts-ipafont \
      fonts-thai-tlwg \
      fonts-lmodern

RUN useradd rails --create-home --shell /bin/bash

# Copy built artifacts: gems, application, PW browsers
COPY --chown=rails:rails --from=build /rails .

# Runtime needs these baked in (asset_host path, newrelic/routes). Declared here, after
# the cached apt/font layers — the COPY above already invalidates everything below it.
ARG BUILD_TAG=local
ARG WCA_LIVE_SITE
ENV BUILD_TAG=$BUILD_TAG \
    WCA_LIVE_SITE=$WCA_LIVE_SITE

# We already need the Playwright CLI which is part of the /rails folder,
#   but we also still need `sudo` privileges to be able to install runtime dependencies through apt
RUN "$PLAYWRIGHT_BROWSERS_PATH/node_modules/playwright/cli.js" install-deps chromium

# Get Certificate to connect to mysql via SSL
RUN curl -o ./rds-cert.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

USER rails:rails

FROM runtime AS sidekiq

ENTRYPOINT ["/rails/bin/docker-entrypoint-sidekiq"]

FROM runtime AS shoryuken

ENTRYPOINT ["/rails/bin/docker-entrypoint-shoryuken"]

FROM runtime AS monolith

EXPOSE 3000

# Regenerate the font cache so WkHtmltopdf can find them
# per https://dalibornasevic.com/posts/76-figuring-out-missing-fonts-for-wkhtmltopdf
RUN fc-cache -f -v

# Entrypoint prepares database and starts app on 0.0.0.0:3000 by default,
# but can also take a rails command, like "console" or "runner" to start instead.
ENV PIDFILE="/rails/pids/puma.pid"

ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["./bin/rails", "server"]

FROM runtime AS monolith-api

EXPOSE 3000

ENV API_ONLY="true"
CMD ["./bin/rails", "server"]
