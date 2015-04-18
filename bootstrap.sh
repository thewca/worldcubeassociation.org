#!/usr/bin/env bash

apt-get update

apt-get install -y apache2
if ! [ -L /var/www/html ]; then
  rm -rf /var/www/html
  ln -fs /vagrant/webroot /var/www/html
fi
