FROM ruby:3.4.1 AS base
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

ARG NODE_MAJOR=20
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
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      software-properties-common \
      git \
      clang \
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

COPY . .

RUN ASSETS_COMPILATION=true SECRET_KEY_BASE=1 RAILS_MAX_THREADS=4 NODE_OPTIONS="--max_old_space_size=4096" ./bin/bundle exec i18n export
RUN --mount=type=cache,uid=1000,target=/rails/tmp/cache ASSETS_COMPILATION=true SECRET_KEY_BASE=1 RAILS_MAX_THREADS=4 NODE_OPTIONS="--max_old_space_size=4096" ./bin/rake assets:precompile

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
USER rails:rails

# Copy built artifacts: gems, application
COPY --from=build /rails .

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
