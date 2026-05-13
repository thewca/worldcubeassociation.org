FROM ruby:3.4.6 AS base
ARG BUILD_TAG=local
ARG WCA_LIVE_SITE
ARG SHAKAPACKER_ASSET_HOST
WORKDIR /rails

ENV DEBIAN_FRONTEND noninteractive

# Set production environment
ENV RAILS_LOG_TO_STDOUT="1" \
    RAILS_ENV="production" \
    BUNDLE_WITHOUT="development:test" \
    BUNDLE_DEPLOYMENT="1" \
    PLAYWRIGHT_BROWSERS_PATH="/rails/pw-browsers" \
    BUILD_TAG=$BUILD_TAG \
    WCA_LIVE_SITE=$WCA_LIVE_SITE \
    SHAKAPACKER_ASSET_HOST=$SHAKAPACKER_ASSET_HOST

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

FROM base AS build

# Enable 'corepack' feature that lets NPM download the package manager on-the-fly as required.
RUN corepack enable

# Install native dependencies for Ruby:
# libvips = image processing for Rails ActiveStorage attachments
# libssl-dev = bindings for the native extensions of Ruby SSL gem
# libyaml-dev = bindings for the native extensions of Ruby psych gem
# tzdata = Timezone information for Rails ActiveSupport
# libclang-dev and cargo = Rust compiler toolchain for Ruby gems that have external Rust bindings
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      git \
      libclang-dev \
      cargo \
      pkg-config \
      libvips \
      libssl-dev \
      libyaml-dev \
      tzdata

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

RUN ASSETS_COMPILATION=true SECRET_KEY_BASE=1 RAILS_MAX_THREADS=4 NODE_OPTIONS="--max_old_space_size=4096" ./bin/i18n export
RUN --mount=type=cache,uid=1000,target=/rails/tmp/cache ASSETS_COMPILATION=true SECRET_KEY_BASE=1 RAILS_MAX_THREADS=4 NODE_OPTIONS="--max_old_space_size=4096" ./bin/rake assets:precompile

# Save the Playwright CLI from certain doom
RUN mkdir -p "$PLAYWRIGHT_BROWSERS_PATH/node_modules"
RUN cp -r node_modules/playwright* "$PLAYWRIGHT_BROWSERS_PATH/node_modules"

RUN rm -rf node_modules

FROM base AS runtime

# Install fonts for rendering PDFs (mostly competition summary PDFs)
# dejavu = Hebrew, Arabic, Greek
# unfonts-core = Korean
# wqy-modern = Chinese
# ipafont = Japanese
# thai-tlwg = Thai (as the name suggests)
# lmodern = Random accents and special symbols for Latin script

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      mariadb-client \
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
