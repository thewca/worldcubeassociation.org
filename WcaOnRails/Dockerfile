FROM ruby:3.3.0

WORKDIR /rails

ENV DEBIAN_FRONTEND noninteractive

# Set production environment
ENV RAILS_LOG_TO_STDOUT="1" \
    RAILS_SERVE_STATIC_FILES="true" \
    RAILS_ENV="production" \
    BUNDLE_WITHOUT="development:test" \
    BUNDLE_DEPLOYMENT="1"

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

# Enable 'corepack' feature that lets NPM download the package manager on-the-fly as required.
RUN corepack enable

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      git \
      pkg-config \
      python-is-python3 \
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

# Using pipx because PEP668 doesn't allow installing systemwide packages anymore
RUN pipx install wrc

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN gem update --system && gem install bundler
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

# Install node dependencies
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# Copy built artifacts: gems, application
COPY . .

# Run and own only the runtime files as a non-root user for security
RUN useradd rails --create-home --shell /bin/bash && \
    chown -R rails:rails db log tmp
USER rails:rails

# Entrypoint prepares database and starts app on 0.0.0.0:3000 by default,
# but can also take a rails command, like "console" or "runner" to start instead.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 3000
CMD ["./bin/bundle", "exec", "unicorn", "-c", "/rails/config/unicorn.rb"]
