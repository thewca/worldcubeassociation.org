require 'shellwords'
require 'securerandom'

include_recipe "wca::base"
include_recipe "nodejs"


secrets = WcaHelper.get_secrets(self)
username, repo_root = WcaHelper.get_username_and_repo_root(self)
if username == "cubing"
  user_lockfile = '/tmp/cubing-user-initialized'
  cmd = ["openssl", "passwd", "-1", secrets['cubing_password']].shelljoin
  hashed_pw = `#{cmd}`.strip
  user username do
    supports :manage_home => true
    home "/home/#{username}"
    shell '/bin/bash'
    password hashed_pw
    not_if { ::File.exists?(user_lockfile) }
  end

  # Trick to run code immediately and last copied from:
  #  https://gist.github.com/nvwls/7672039
  ruby_block 'last' do
    block do
      puts "#"*80
      puts "# Created user #{username} with password #{secrets['cubing_password']}"
      puts "#"*80
    end
    not_if { ::File.exists?(user_lockfile) }
  end
  ruby_block 'notify' do
    block do
      true
    end
    notifies :run, 'ruby_block[last]', :delayed
    not_if { ::File.exists?(user_lockfile) }
  end

  file user_lockfile do
    action :create_if_missing
  end

  ssh_known_hosts_entry 'github.com'
  if !Dir.exists? repo_root
    branch = "master"
    git repo_root do
      repository "https://github.com/thewca/worldcubeassociation.org.git"
      revision branch
      # See http://lists.opscode.com/sympa/arc/chef/2015-03/msg00308.html
      # for the reason for checkout_branch and "enable_checkout false"
      checkout_branch branch
      enable_checkout false
      action :sync
      enable_submodules true

      user username
      group username
    end
  end
end
rails_root = "#{repo_root}/WcaOnRails"


#### Mysql
mysql_service 'default' do
  version '5.6'
  initial_root_password secrets['mysql_password']
  # Force default socket to make rails happy
  socket "/var/run/mysqld/mysqld.sock"
  action [:create, :start]
end
mysql_config 'default' do
  source 'mysql-wca.cnf.erb'
  notifies :restart, 'mysql_service[default]'
  action :create
end
template "/etc/my.cnf" do
  source "my.cnf.erb"
  mode 0644
  owner 'root'
  group 'root'
  variables({
    secrets: secrets
  })
end


#### Ruby and Rails
# Install native dependencies for gems
package 'libghc-zlib-dev'
package 'libsqlite3-dev'
package 'g++'
package 'libmysqlclient-dev'
package 'imagemagick'

# We need PhantomJS 2.0 to run some of our tests
remote_file '/usr/bin/phantomjs' do
  source 'http://github.com/Pyppe/phantomjs2.0-ubuntu14.04x64/raw/master/bin/phantomjs'
  owner 'root'
  group 'root'
  mode '0777'
  action :create_if_missing
end

node.default['brightbox-ruby']['version'] = "2.3"
include_recipe "brightbox-ruby"
gem_package "rails" do
  version "4.2.1"
end
chef_env_to_rails_env = {
  "development" => "development",
  "staging" => "production",
  "production" => "production",
}
rails_env = chef_env_to_rails_env[node.chef_environment]

LOGROTATE_OPTIONS = ['nodelaycompress', 'compress']

logrotate_app 'rails-wca' do
  path "#{repo_root}/WcaOnRails/log/production.log"
  size "512M"
  maxage 90
  options LOGROTATE_OPTIONS

  postrotate "[ ! -f #{repo_root}/WcaOnRails/pids/unicorn.pid ] || kill -USR1 `cat #{repo_root}/WcaOnRails/pids/unicorn.pid`"
end

logrotate_app 'delayed_job-wca' do
  path "#{repo_root}/WcaOnRails/log/delayed_job.log"
  size "512M"
  maxage 30
  options LOGROTATE_OPTIONS

  # According to https://groups.google.com/forum/#!topic/railsmachine-moonshine/vrfNwrqmzOA,
  # it looks like we have to restart delayed job after after logrotate.
  postrotate "#{repo_root}/scripts/deploy.sh restart_dj"
end

# Run mailcatcher in every environment except production.
if rails_env != "production"
  gem_package "mailcatcher"
  execute "start mailcatcher" do
    command "mailcatcher --http-ip=0.0.0.0"
    not_if "pgrep -f [m]ailcatcher"
  end
end

# Use HTTPS in non development mode
https = !node.chef_environment.start_with?("development")

#### Nginx
# Unfortunately, we have to compile nginx from source to get the auth request module
# See: https://bugs.launchpad.net/ubuntu/+source/nginx/+bug/1323387

# Nginx dependencies copied from http://www.rackspace.com/knowledge_center/article/ubuntu-and-debian-installing-nginx-from-source
package 'libc6'
package 'libpcre3'
package 'libssl0.9.8'
package 'zlib1g'
package 'lsb-base'
# http://stackoverflow.com/a/14046228
package 'libpcre3-dev'
# http://serverfault.com/a/416573
package 'libssl-dev'

bash "build nginx" do
  code <<-EOH
    set -e # exit on error
    cd /tmp
    wget http://nginx.org/download/nginx-1.11.8.tar.gz
    tar xvf nginx-1.11.8.tar.gz
    cd nginx-1.11.8
    ./configure --sbin-path=/usr/local/sbin --with-http_ssl_module --with-http_auth_request_module --with-http_gzip_static_module --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log
    make
    sudo make install
    EOH

  # Don't build nginx if we've already built it.
  not_if { ::File.exists?('/usr/local/sbin/nginx') }
end
template "/etc/nginx/fcgi.conf" do
  source "fcgi.conf.erb"
  variables({
    username: username,
  })
  notifies :run, 'execute[reload-nginx]', :delayed
end
template "/etc/init.d/nginx" do
  source "nginx.erb"
  mode 0755
  owner 'root'
  group 'root'
  notifies :run, 'execute[update-rc]', :delayed
end
template "/etc/nginx/nginx.conf" do
  source "nginx.conf.erb"
  mode 0644
  owner 'root'
  group 'root'
  variables({
    username: username,
  })
  notifies :run, 'execute[reload-nginx]', :delayed
end
directory "/etc/nginx/conf.d" do
  owner 'root'
  group 'root'
end
logrotate_app 'nginx-wca' do
  path "/var/log/nginx/*.log"
  size "512M"
  maxage 30
  options LOGROTATE_OPTIONS

  postrotate "[ ! -f /var/run/nginx.pid ] || kill -USR1 `cat /var/run/nginx.pid`"
end

server_name = { "production" => "www.worldcubeassociation.org", "staging" => "staging.worldcubeassociation.org", "development" => "" }[node.chef_environment]
template "/etc/nginx/conf.d/worldcubeassociation.org.conf" do
  source "worldcubeassociation.org.conf.erb"
  mode 0644
  owner 'root'
  group 'root'
  variables({
    username: username,
    rails_root: rails_root,
    repo_root: repo_root,
    rails_env: rails_env,
    https: https,
    server_name: server_name,
  })
  notifies :run, 'execute[reload-nginx]', :delayed
end
template "/etc/nginx/wca_https.conf" do
  source "wca_https.conf.erb"
  mode 0644
  owner 'root'
  group 'root'
  variables({
    username: username,
    rails_root: rails_root,
    repo_root: repo_root,
    rails_env: rails_env,
    https: https,
    server_name: server_name,
  })
  notifies :run, 'execute[reload-nginx]', :delayed
end
# Start nginx if it's not already running.
execute "nginx" do
  not_if "ps -efw | grep [n]ginx.*master"
end
execute "reload-nginx" do
  command "/etc/init.d/nginx reload || /etc/init.d/nginx start"
  action :nothing
end
execute "update-rc" do
  command "/usr/sbin/update-rc.d -f nginx defaults"
  action :nothing
end


#### Rails secrets
db_url = "mysql2://root:#{secrets['mysql_password']}@localhost/cubing"
template "#{rails_root}/.env.production" do
  source "env.production.erb"
  mode 0644
  owner username
  group username
  variables({
    secrets: secrets,
    db_url: db_url,
  })
end

#### Legacy PHP results system
PHP_MEMORY_LIMIT = '512M'
PHP_IDLE_TIMEOUT_SECONDS = 120
PHP_POST_MAX_SIZE = '20M'
PHP_MAX_INPUT_VARS = 5000
package 'php5-cli'
include_recipe 'php-fpm::install'
php_fpm_pool "www" do
  listen "/var/run/php5-fpm.#{username}.sock"
  user username
  group username
  process_manager "dynamic"
  max_children 9
  min_spare_servers 2
  max_spare_servers 4
  max_requests 200
  php_options 'php_admin_flag[log_errors]' => 'on', 'php_admin_value[memory_limit]' => PHP_MEMORY_LIMIT
end
execute "sed -i -r 's/(; *)?memory_limit = .*/memory_limit = #{PHP_MEMORY_LIMIT}/g' /etc/php5/fpm/php.ini" do
  not_if "grep '^memory_limit = #{PHP_MEMORY_LIMIT}' /etc/php5/fpm/php.ini"
end
execute "sed -i -r 's/(; *)?max_execution_time = .*/max_execution_time = #{PHP_IDLE_TIMEOUT_SECONDS}/g' /etc/php5/fpm/php.ini" do
  not_if "grep '^max_execution_time = #{PHP_IDLE_TIMEOUT_SECONDS}' /etc/php5/fpm/php.ini"
end
execute "sed -i -r 's/(; *)?post_max_size = .*/post_max_size = #{PHP_POST_MAX_SIZE}/g' /etc/php5/fpm/php.ini" do
  not_if "grep '^post_max_size = #{PHP_POST_MAX_SIZE}' /etc/php5/fpm/php.ini"
end
execute "sed -i -r 's/(; *)?max_input_vars = .*/max_input_vars = #{PHP_MAX_INPUT_VARS}/g' /etc/php5/fpm/php.ini" do
  not_if "grep '^max_input_vars = #{PHP_MAX_INPUT_VARS}' /etc/php5/fpm/php.ini"
end
# Install pear mail
# http://www.markstechstuff.com/2009/04/installing-pear-mail-for-php-on-ubuntu.html
package "php-pear"
execute "pear install mail Net_SMTP Auth_SASL mail_mime"
# Install mysqli for php. See:
#  http://stackoverflow.com/a/22525205
package "php5-mysqlnd"
template "#{repo_root}/webroot/results/includes/_config.php" do
  source "results_config.php.erb"
  mode 0644
  owner username
  group username
  variables({
    secrets: secrets,
  })
end

#### Initialize rails gems/database
execute "bundle install #{'--deployment --without development test' if rails_env == 'production'} --path /home/#{username}/.bundle" do
  user username
  cwd rails_root
  environment({
    "RACK_ENV" => rails_env,
  })
end

if node.chef_environment.start_with?("development")
  db_setup_lockfile = '/tmp/rake-db-setup-run'
  execute "bundle exec rake db:setup" do
    cwd rails_root
    environment({
      "DATABASE_URL" => db_url,
      "RACK_ENV" => rails_env,
    })
    not_if { ::File.exists?(db_setup_lockfile) }
  end
  file db_setup_lockfile do
    action :create_if_missing
  end
else
  db_dump_folder = "#{repo_root}/secrets/wca_db"
  execute "#{repo_root}/scripts/db.sh import #{db_dump_folder}"
end

#### Screen
template "/home/#{username}/.bash_profile" do
  source "bash_profile.erb"
  mode 0644
  owner username
  group username
end
template "/home/#{username}/.bashrc" do
  source "bashrc.erb"
  mode 0644
  owner username
  group username
end
template "/home/#{username}/wca.screenrc" do
  source "wca.screenrc.erb"
  mode 0644
  owner username
  group username
  variables({
    rails_root: rails_root,
    rails_env: rails_env,
    db_url: db_url,
    secrets: secrets,
  })
end
template "/home/#{username}/startall" do
  source "startall.erb"
  mode 0755
  owner username
  group username
end
# We "sudo su ..." because simply specifying "user ..." doesn't invoke a login shell,
# which makes for a very screwy screen (we're logged in as username, but HOME
# is /home/root, for instance).
execute "sudo su #{username} -c '~/startall'" do
  user username
  not_if "screen -S wca -Q select", user: username
end
# Start screen at boot by creating our own /etc/init.d/rc.local
# Hopefully no one else needs to touch this file... there has *got* to be a
# more portable way of doing this.
template "/etc/rc.local" do
  source "rc.local.erb"
  mode 0755
  owner 'root'
  group 'root'
  variables({
    username: username,
  })
end
