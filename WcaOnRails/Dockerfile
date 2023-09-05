FROM ruby:3.2.2
EXPOSE 3000

ENV DEBIAN_FRONTEND noninteractive
WORKDIR /app

# Add PPA needed to install nodejs.
# From: https://github.com/nodesource/distributions#debian-and-ubuntu-based-distributions
RUN apt-get update \
apt-get install -y ca-certificates curl gnupg \
mkdir -p /etc/apt/keyrings \
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \

RUN NODE_MAJOR=16 echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update && apt-get install -y curl gnupg wget nodejs

# The Latest Ruby image doesn't come with libffi7 anymore
RUN wget http://es.archive.ubuntu.com/ubuntu/pool/main/libf/libffi/libffi7_3.3-4_amd64.deb
RUN dpkg -i libffi7_3.3-4_amd64.deb

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
  libyaml-dev \
  tzdata

RUN gem update --system && gem install bundler
