FROM ubuntu:18.04

ENV DEBIAN_FRONTEND noninteractive
WORKDIR /app

# Add PPA needed to install yarn.
# From: https://yarnpkg.com/en/docs/install#debian-stable
RUN apt-get update && apt-get install -y curl gnupg
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list

RUN apt-get update && apt-get install -y \
  git \
  ruby \
  ruby-dev \
  yarn \
  build-essential \
  nodejs \
  mysql-client-5.7 \
  libmysqlclient-dev \
  libssl-dev \
  tzdata \
  # Fix for https://github.com/ariya/phantomjs/issues/14433
  libfontconfig

RUN gem install bundler
ADD ./Gemfile .
ADD ./Gemfile.lock .
RUN bundle install

ADD ./package.json .
ADD ./yarn.lock .
ADD ./bin/yarn ./bin/
RUN bin/yarn

# Make it possible to connect to the database by just running `mysql`.
RUN printf "[client]\nhost=db" > ~/.my.cnf
