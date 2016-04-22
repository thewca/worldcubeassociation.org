FROM ubuntu:14.04

ADD ./WcaOnRails /app/WcaOnRails

ENV agi="apt-get install --yes --no-install-recommends"

# From https://www.brightbox.com/docs/ruby/ubuntu/
RUN $agi software-properties-common
RUN apt-add-repository --yes ppa:brightbox/ruby-ng

RUN apt-get update
RUN apt-get dist-upgrade --yes --force-yes --no-install-recommends

RUN $agi ruby2.2-dev ruby2.2
RUN gem install bundler

RUN $agi git
RUN $agi libghc-zlib-dev
RUN $agi g++
RUN $agi libmysqlclient-dev
RUN $agi imagemagick

RUN $agi build-essential

WORKDIR /app/WcaOnRails
RUN bundle install

EXPOSE 3000
