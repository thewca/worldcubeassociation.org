FROM ruby:3.3.0 AS base
ARG BUILD_TAG=local
ARG WCA_REGISTRATIONS_URL
ARG WCA_REGISTRATIONS_POLL_URL
ARG ROOT_URL
WORKDIR /rails

ENV DEBIAN_FRONTEND noninteractive

# Set production environment
ENV RAILS_LOG_TO_STDOUT="1" \
    RAILS_SERVE_STATIC_FILES="true" \
    RAILS_ENV="production" \
    BUNDLE_WITHOUT="development:test" \
    BUNDLE_DEPLOYMENT="1" \
    BUILD_TAG=$BUILD_TAG \
    WCA_REGISTRATIONS_URL=$WCA_REGISTRATIONS_URL \
    WCA_REGISTRATIONS_POLL_URL=$WCA_REGISTRATIONS_POLL_URL \
    ROOT_URL=$ROOT_URL

# Add dependencies necessary to install nodejs.
# From: https://github.com/nodesource/distributions#debian-and-ubuntu-based-distributions
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      ca-certificates \
      curl \
      gnupg

FROM base AS build

ARG NODE_MAJOR=20
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash && \
    apt-get install -y nodejs

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
      pkg-config \
      libvips \
      libssl-dev \
      libyaml-dev \
      tzdata

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN gem update --system && gem install bundler

COPY . .
RUN ./bin/bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

# Install node dependencies
COPY package.json yarn.lock .yarnrc.yml ./
RUN ./bin/yarn install --immutable

RUN ASSETS_COMPILATION=true SECRET_KEY_BASE=1 ./bin/bundle exec i18n export
RUN ASSETS_COMPILATION=true SECRET_KEY_BASE=1 ./bin/rake assets:precompile

RUN rm -rf node_modules

FROM base AS runtime

# Copy built artifacts: gems, application
COPY --from=build /rails .

# Run and own only the runtime files as a non-root user for security
RUN useradd rails --create-home --shell /bin/bash && \
    chown -R rails:rails vendor db log tmp public app pids

FROM runtime AS sidekiq

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      zip \
      python-is-python3
USER rails:rails
RUN gem install mailcatcher

ENTRYPOINT ["/rails/bin/docker-entrypoint-sidekiq"]

FROM runtime AS monolith

EXPOSE 3000

# Install fonts for rendering PDFs (mostly competition summary PDFs)
# dejavu = Hebrew, Arabic, Greek
# unfonts-core = Korean
# wqy-modern = Chinese
# ipafont = Japanese
# lmodern = Random accents and special symbols for Latin script
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      fonts-dejavu \
      fonts-unfonts-core \
      fonts-wqy-microhei \
      fonts-ipafont \
      fonts-lmodern
USER rails:rails
# Regenerate the font cache so WkHtmltopdf can find them
# per https://dalibornasevic.com/posts/76-figuring-out-missing-fonts-for-wkhtmltopdf
RUN fc-cache -f -v

# Entrypoint prepares database and starts app on 0.0.0.0:3000 by default,
# but can also take a rails command, like "console" or "runner" to start instead.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["./bin/bundle", "exec", "unicorn", "-c", "/rails/config/unicorn.rb"]
