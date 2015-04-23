#!/usr/bin/env bash

set -e

install_deps() {
  # Enable repository for ruby and nodejs
  #  https://gorails.com/setup/ubuntu/14.04
  sudo apt-add-repository -y ppa:brightbox/ruby-ng
  sudo apt-add-repository -y ppa:chris-lea/node.js
  sudo apt-get -y update

  # Install ruby, rails, and nodejs
  #  https://gorails.com/setup/ubuntu/14.04
  sudo apt-get install -y ruby2.2 ruby2.2-dev
  sudo apt-get install -y nodejs
  sudo apt-get install -y libghc-zlib-dev libfcgi-dev libsqlite3-dev g++
  sudo gem install bundler --no-document
  sudo gem install rails -v 4.2.1 --no-document
  sudo gem install fcgi --no-document

  # Restart apache to recognize new ruby.
  sudo service apache2 restart
}

rebuild() {
  # Install dependencies for WcaOnRails
  (cd WcaOnRails; bundle install)
}

cd "$(dirname "$0")"/..
source scripts/_parse_args.sh
