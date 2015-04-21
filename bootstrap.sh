#!/usr/bin/env bash

sudo apt-get -y update

# Installing mysql-server prompts for a password. Workaround from:
#  http://stackoverflow.com/a/7740571
sudo debconf-set-selections <<< 'mysql-server mysql-server/root_password password root'
sudo debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password root'
sudo apt-get install -y lamp-server^
if ! [ -L /var/www/html ]; then
  rm -rf /var/www/html
  ln -fs /vagrant/webroot /var/www/html
fi

# Enable .htaccess (disabled by default).
sudo sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

sudo a2enmod cgi
sudo a2enmod rewrite
# For now, we don't support SSL for development.
#sudo a2enmod ssl
sudo a2enmod headers

# Must restart apache after enabling new modules.
sudo service apache2 restart

# Configuration files containing database credentials.
# We copy instead of creating symlinks because VirtualBox
# in Windows doesn't allow creating symlinks in shared folders.
#  https://forums.virtualbox.org/viewtopic.php?f=6&t=54042
sudo cp /vagrant/config/results_config.php /vagrant/webroot/results/includes/_config.php
sudo cp /vagrant/config/results_admin_htaccess /vagrant/webroot/results/admin/.htaccess

# Dependencies for wca-documents-extra. Some of this came from
# https://github.com/cubing/wca-documents-extra/blob/master/.travis.yml, but has
# been tweaked for Ubuntu 14.04
sudo apt-get install -y git
sudo apt-get install -y texlive-fonts-recommended
sudo apt-get install --no-install-recommends -y pandoc fonts-unfonts-core fonts-arphic-uming
sudo apt-get install --no-install-recommends -y texlive-lang-all texlive-xetex texlive-latex-recommended texlive-latex-extra lmodern

# Build WCA regulations
sudo /vagrant/wca-documents-extra/make.py --wca && if [ -a /vagrant/webroot/regulations ]; then sudo rm -rf /vagrant/webroot/regulations-todelete && sudo mv /vagrant/webroot/regulations /vagrant/webroot/regulations-todelete; fi && sudo mv /vagrant/wca-documents-extra/build/regulations /vagrant/webroot/ && sudo rm -rf /vagrant/webroot/regulations-todelete
