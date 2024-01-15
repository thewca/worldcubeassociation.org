FROM ruby:3.2.2

ENV DEBIAN_FRONTEND noninteractive
WORKDIR /app
ARG NODE_MAJOR=20

# Set production environment
ENV RAILS_LOG_TO_STDOUT="1" \
    RAILS_SERVE_STATIC_FILES="true" \
    RAILS_ENV="production" \
    BUNDLE_WITHOUT="development:test"

# Add PPA needed to install nodejs.
# From: https://github.com/nodesource/distributions#debian-and-ubuntu-based-distributions
RUN apt-get update && apt-get install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update && apt-get install -y \
  git \
  build-essential \
  nodejs \
  mariadb-client \
  libssl-dev \
  libyaml-dev \
  python3-pip \
  fonts-unfonts-core \
  fonts-wqy-microhei \
  fonts-ipafont \
  lmodern \
  libxrender1 \
  pipx \
  tzdata
RUN wget https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.4/wkhtmltox-0.12.4_linux-generic-amd64.tar.xz -O wkhtml.tar.xz && tar -xf wkhtml.tar.xz --strip-components=1 -C /usr/local
# Enable 'corepack' feature that lets NPM download the package manager on-the-fly as required.
RUN corepack enable
# Using pipx because PEP668 doesn't allow installing systemwide packages anymore
RUN pipx install wrc

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN bundle install
# Install node dependencies
COPY package.json ./
RUN npm install

COPY . .

# Entrypoint prepares database and starts app on 0.0.0.0:3000 by default,
# but can also take a rails command, like "console" or "runner" to start instead.
ENTRYPOINT ["/app/bin/docker-entrypoint"]
EXPOSE 3000
