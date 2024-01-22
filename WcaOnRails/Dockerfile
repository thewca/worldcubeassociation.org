FROM ruby:3.3.0 AS base

WORKDIR /rails

ENV DEBIAN_FRONTEND noninteractive

# Set production environment
ENV RAILS_LOG_TO_STDOUT="1" \
    RAILS_SERVE_STATIC_FILES="true" \
    RAILS_ENV="production" \
    BUNDLE_WITHOUT="development:test" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle"

FROM base AS build

# Add PPA needed to install nodejs.
# From: https://github.com/nodesource/distributions#debian-and-ubuntu-based-distributions
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y  \
      build-essential \
      curl \
      git \
      libvips \
      node-gyp \
      pkg-config \
      python-is-python3 \
      ca-certificates \
      gnupg

ARG NODE_MAJOR=20
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | sudo -E bash - && \
    apt-get install -y nodejs
# Enable 'corepack' feature that lets NPM download the package manager on-the-fly as required.
RUN corepack enable

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN gem update --system && gem install bundler
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

# Install node dependencies
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY . .

RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails i18n export
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

FROM base

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      curl \
      nodejs \
      mariadb-client \
      libvips \
      libssl-dev \
      libyaml-dev \
      python3-pip \
      fonts-unfonts-core \
      fonts-wqy-microhei \
      fonts-ipafont \
      lmodern \
      libxrender1 \
      pipx \
      tzdata && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

RUN wget https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.4/wkhtmltox-0.12.4_linux-generic-amd64.tar.xz -O wkhtml.tar.xz && tar -xf wkhtml.tar.xz --strip-components=1 -C /usr/local
# Enable 'corepack' feature that lets NPM download the package manager on-the-fly as required.
RUN corepack enable
# Using pipx because PEP668 doesn't allow installing systemwide packages anymore
RUN pipx install wrc

# Copy built artifacts: gems, application
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /rails /rails

# Run and own only the runtime files as a non-root user for security
RUN useradd rails --create-home --shell /bin/bash && \
    chown -R rails:rails db log storage tmp
USER rails:rails

# Entrypoint prepares database and starts app on 0.0.0.0:3000 by default,
# but can also take a rails command, like "console" or "runner" to start instead.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 3000
CMD [".bin/bundle", "exec", "unicorn", "-c", "/app/config/unicorn.rb"]
