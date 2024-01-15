FROM ruby:3.2.2
EXPOSE 3000

ENV DEBIAN_FRONTEND noninteractive
WORKDIR /app
ARG NODE_MAJOR=20

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
  tzdata

# Enable 'corepack' feature that lets NPM download the package manager on-the-fly as required.
RUN corepack enable

RUN gem update --system && gem install bundler
