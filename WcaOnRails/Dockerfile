FROM ruby:3.1.2
EXPOSE 3000

ENV DEBIAN_FRONTEND noninteractive
WORKDIR /app

RUN apt-get update && apt-get install -y curl gnupg

# Add PPA needed to install nodejs.
# From: https://github.com/nodesource/distributions
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -

# Add PPA needed to install yarn.
# From: https://yarnpkg.com/en/docs/install#debian-stable
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list

RUN apt-get update && apt-get install -y \
  git \
  yarn \
  build-essential \
  nodejs \
  mariadb-client \
  libssl-dev \
  tzdata

RUN gem update --system && gem install bundler
