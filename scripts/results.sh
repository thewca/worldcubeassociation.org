#!/usr/bin/env bash

set -ex

MYSQL_PASSWORD=root
PHP_IDLE_TIMEOUT_SECONDS=120
PHP_MEMORY_LIMIT_MEGABYTES=512

install_deps() {
  # Enable multiverse (for libapache2-mod-fastcgi)
  #  https://www.vultr.com/docs/use-php5-fpm-with-apache-2-on-ubuntu-14-04
  sudo sed -i 's/^# \(.*multiverse\)$/\1/' /etc/apt/sources.list
  sudo apt-get -y update

  # Install apache
  sudo apt-get install -y apache2-mpm-event

  # Install fastcgi
  sudo apt-get install -y libapache2-mod-fastcgi php5-fpm

  # Install mysqli for php. See:
  #  http://stackoverflow.com/a/22525205
  sudo apt-get install -y php5-mysqlnd

  # Run apache and php-fpm as vagrant user. This is necessary because
  # everything in /vagrant is owned by vagrant.
  sudo sed -i 's/www-data/vagrant/g' /etc/apache2/envvars
  sudo sed -i 's/www-data/vagrant/g' /etc/php5/fpm/pool.d/www.conf
  # Fix up some permissions issues due to running as vagrant instead of www-data.
  sudo chown -R vagrant:vagrant /var/lib/apache2/fastcgi
  sudo chown -R vagrant:vagrant /usr/lib/cgi-bin/
  sudo sed -i 's/memory_limit = .*/memory_limit = ${PHP_MEMORY_LIMIT_MEGABYTES}M/g' /etc/php5/fpm/php.ini

  # Enable fastcgi. See:
  #  https://www.digitalocean.com/community/questions/apache-2-4-with-php5-fpm?answer=12056
  cat <<EOF > /tmp/php5-fpm.conf
<IfModule mod_fastcgi.c>
AddHandler php5-fcgi .php
Action php5-fcgi /php5-fcgi
Alias /php5-fcgi /usr/lib/cgi-bin/php5-fcgi
FastCgiExternalServer /usr/lib/cgi-bin/php5-fcgi -socket /var/run/php5-fpm.sock -pass-header Authorization -idle-timeout $PHP_IDLE_TIMEOUT_SECONDS
</IfModule>
EOF
  sudo mv /tmp/php5-fpm.conf /etc/apache2/conf-available/php5-fpm.conf
  sudo a2enmod actions fastcgi alias
  sudo a2enconf php5-fpm

  # Enable .htaccess (disabled by default).
  sudo sudo sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

  # Set DocumentRoot to /vagrant/webroot
  sudo sed -i 's_DocumentRoot /var/www/html_DocumentRoot /vagrant/webroot_' /etc/apache2/sites-available/000-default.conf
  sudo sed -i 's_Directory /var/www/_Directory /vagrant/webroot_' /etc/apache2/apache2.conf

  sudo a2enmod cgi
  sudo a2enmod rewrite
  # For now, we don't support SSL for development.
  #sudo a2enmod ssl
  sudo a2enmod headers

  # Restart apache and php5-fpm after all the above configuration changes.
  sudo service apache2 restart
  sudo service php5-fpm restart

  # Installing mysql-server prompts for a password. Workaround from:
  #  http://stackoverflow.com/a/7740571
  sudo echo "mysql-server mysql-server/root_password password $MYSQL_PASSWORD" | debconf-set-selections
  sudo echo "mysql-server mysql-server/root_password_again password $MYSQL_PASSWORD" | debconf-set-selections
  sudo apt-get install -y mysql-server

  # Configuration files containing database credentials.
  # We copy instead of creating symlinks because VirtualBox
  # in Windows doesn't allow creating symlinks in shared folders.
  #  https://forums.virtualbox.org/viewtopic.php?f=6&t=54042
  cp config/results_config.php webroot/results/includes/_config.php
  cp config/results_admin_htaccess webroot/results/admin/.htaccess

  import_db
}

import_db() {
  rm -rf /tmp/import_db
  mkdir -p /tmp/import_db

  # Extract full export into .sql files and import them.
  tar xf worldcubeassociation.org_alldbs.tar.gz -C /tmp/import_db
  for sql_file in /tmp/import_db/*.sql; do
    table_name=`basename $sql_file .sql`
    echo "Importing $table_name table..."
    echo "CREATE DATABASE IF NOT EXISTS $table_name;" | mysql -h localhost -uroot -p$MYSQL_PASSWORD
    mysql -h localhost -uroot -p$MYSQL_PASSWORD $table_name < $sql_file
  done
}

rebuild() {
  echo "Compute auxiliary data..."
  time curl 'http://localhost/results/admin/compute_auxiliary_data.php?doit=+Do+it+now+'

  echo "Update missing averages..."
  time curl 'http://localhost/results/misc/missing_averages/update7205.php'

  echo "Update Evolution of Records..."
  time curl 'http://localhost/results/misc/evolution/update7205.php'
}

cd "$(dirname "$0")"/..
source scripts/_parse_args.sh
