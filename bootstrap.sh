#!/usr/bin/env bash

apt-get update

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
sudo ln -fs /vagrant/config/results_config.php /vagrant/webroot/results/includes/_config.php
