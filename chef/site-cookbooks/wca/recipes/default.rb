require 'fileutils'
require 'shellwords'
require 'securerandom'

include_recipe "wca::base"

node.default['nodejs']['version'] = '16.15.0'
node.default['nodejs']['repo'] = 'https://deb.nodesource.com/node_16.x'
include_recipe "nodejs"

npm_package 'yarn' do
  version '1.22.18'
  options ['--global']
end

secrets = WcaHelper.get_secrets(self)
username, repo_root = WcaHelper.get_username_and_repo_root(self)
if username == "cubing"
  user_lockfile = '/tmp/cubing-user-initialized'
  cmd = ["openssl", "passwd", "-1", secrets['cubing_password']].shelljoin
  hashed_pw = `#{cmd}`.strip
  user username do
    manage_home true
    home "/home/#{username}"
    shell '/bin/bash'
    password hashed_pw
    not_if { ::File.exist?(user_lockfile) }
  end

  # Trick to run code immediately and last copied from:
  #  https://gist.github.com/nvwls/7672039
  ruby_block 'last' do
    block do
      puts "#"*80
      puts "# Created user #{username} with password #{secrets['cubing_password']}"
      puts "#"*80
    end
    not_if { ::File.exist?(user_lockfile) }
  end
  ruby_block 'notify' do
    block do
      true
    end
    notifies :run, 'ruby_block[last]', :delayed
    not_if { ::File.exist?(user_lockfile) }
  end

  file user_lockfile do
    action :create_if_missing
  end

  ssh_known_hosts_entry 'github.com'
  unless Dir.exist? repo_root
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

#### SSH Keys
# acces.sh depends on jq https://github.com/FatBoyXPC/acces.sh
package 'jq'

gen_auth_keys_path = "/home/#{username}/gen-authorized-keys.sh"
template gen_auth_keys_path do
  source "gen-authorized-keys.sh.erb"
  mode 0755
  owner username
  group username
  variables({
              secrets: secrets,
            })
end
execute gen_auth_keys_path do
  user username
end

#### Mysql
package 'mysql-client-8.0'
db = {
  'user' => 'root',
}
if node.chef_environment == "production"
  # In production mode, we use Amazon RDS.
  db['host'] = "worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
  db['read_replica'] = "readonly-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
  db['password'] = secrets['mysql_password']
elsif node.chef_environment == "staging"
  # In staging mode, we use Amazon RDS.
  db['host'] = "staging-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
  db['read_replica'] = "readonly-staging-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
  db['password'] = secrets['mysql_password']
else
  # If not in the cloud, then we run a local mysql instance.
  socket = "/var/run/mysqld/mysqld.sock"
  db['host'] = 'localhost'
  db['socket'] = socket
  db['password'] = secrets['mysql_password']
  mysql_service 'default' do
    version '8.0'
    charset 'utf8mb4'
    bind_address '127.0.0.1'
    initial_root_password secrets['mysql_password']
    # Force default socket to make rails happy
    socket socket
    action [:create, :start]
  end
  mysql_config 'default' do
    source 'mysql-wca.cnf.erb'
    instance 'default'
    notifies :restart, 'mysql_service[default]'
    action :create
  end
end
db_url = "mysql2://#{db['user']}:#{db['password']}@#{db['host']}/cubing"
read_replica = db["read_replica"]
template "/etc/my.cnf" do
  source "my.cnf.erb"
  mode 0644
  owner 'root'
  group 'root'
  variables({
              secrets: secrets,
              db: db,
            })
end

### Fonts for generating PDFs
package 'fonts-thai-tlwg'

#### Ruby and Rails
# Install native dependencies for gems
package 'libghc-zlib-dev'
package 'libsqlite3-dev'
package 'libyaml-dev' #newly required by Psych 5.0
package 'g++'
package 'libmysqlclient-dev'
package 'imagemagick'
package 'poppler-utils' # Required by ActiveStorage built-in PDF previewer.

ruby_version = File.read("#{rails_root}/.ruby-version").strip

# Install rbenv itself
rbenv_user_install username

# install the desired Ruby version through rbenv
rbenv_ruby ruby_version do
  user username
end

# set the Ruby version we just installed as global default
# mainly useful so script invocations like 'gem' or 'bundle' work regardless of PWD.
rbenv_global ruby_version do
  user username
end

bundler_version = File.read("#{rails_root}/Gemfile.lock").strip.match(/\d+(?:\.\d+)+$/)[0]
gem_package "bundler" do
  version bundler_version
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
  # it looks like we have to restart delayed job after logrotate.
  postrotate "#{repo_root}/scripts/deploy.sh restart_dj"
end

# Run mailcatcher in every environment except production.
if node.chef_environment != "production"
  gem_package "mailcatcher"
  execute "start mailcatcher" do
    command "mailcatcher --no-quit --http-ip=0.0.0.0"
    not_if "pgrep -f [m]ailcatcher"
  end
end

server_name = {
  "production" => "www.worldcubeassociation.org",
  "staging" => "staging.worldcubeassociation.org",
  "development" => "",
}[node.chef_environment]

#### Nginx
# Unfortunately, we have to compile nginx from source to get the auth request module
# See: https://bugs.launchpad.net/ubuntu/+source/nginx/+bug/1323387

# Nginx dependencies copied from https://www.alibabacloud.com/blog/how-to-build-nginx-from-source-on-ubuntu-20-04-lts_597793
package 'libpcre3'
package 'libpcre3-dev'
package 'zlib1g'
package 'zlib1g-dev'
package 'libssl-dev'
package 'libgd-dev'
package 'libxml2'
package 'libxml2-dev'
package 'uuid-dev'

bash "build nginx" do
  code <<-EOH
    set -e # exit on error
    cd /tmp
    wget http://nginx.org/download/nginx-1.21.1.tar.gz
    tar xvf nginx-1.21.1.tar.gz
    cd nginx-1.21.1
    ./configure --sbin-path=/usr/local/sbin --with-http_ssl_module --with-http_auth_request_module --with-http_gzip_static_module --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log
    make
    sudo make install
  EOH

  # Don't build nginx if we've already built it.
  not_if { ::File.exist?('/usr/local/sbin/nginx') }
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
# Don't be confused by the name of this file! This is used by both our staging
# and our prod environments (because staging runs in the rails "production"
# mode).
template "#{rails_root}/.env.production" do
  source "env.production.erb"
  mode 0644
  owner username
  group username
  variables({
              secrets: secrets,
              db_url: db_url,
              read_replica_host: read_replica
            })
end

#### phpMyAdmin
pma_path = "#{repo_root}/webroot/results/admin/phpMyAdmin"
bash 'install phpMyAdmin' do
  cwd ::File.dirname("/tmp")
  code <<-EOH
    cd /tmp
    wget https://files.phpmyadmin.net/phpMyAdmin/4.9.7/phpMyAdmin-4.9.7-english.tar.gz
    tar xvf phpMyAdmin-4.9.7-english.tar.gz
    mv phpMyAdmin-4.9.7-english #{pma_path}
  EOH
  not_if { ::File.exist?(pma_path) }
end
template "#{repo_root}/webroot/results/admin/phpMyAdmin/config.inc.php" do
  source "phpMyAdmin_config.inc.php.erb"
  variables({
              secrets: secrets,
              db: db,
            })
end

#### Legacy PHP results system
PHP_MEMORY_LIMIT = '768M'
PHP_IDLE_TIMEOUT_SECONDS = 120
PHP_POST_MAX_SIZE = '20M'
PHP_MAX_INPUT_VARS = 5000
apt_repository 'legacy-php' do
  uri 'ppa:ondrej/php'
end
package 'php5.6-cli'
package 'php5.6-mbstring' # gregorbg necessary for results posting when competitors have non-ASCII names
node.default['php-fpm']['skip_repository_install'] = true
node.default['php-fpm']['package_name'] = 'php5.6-fpm'
node.default['php-fpm']['conf_dir'] = '/etc/php/5.6/fpm/conf.d'
node.default['php-fpm']['pool_conf_dir'] = '/etc/php/5.6/fpm/pool.d'
node.default['php-fpm']['conf_file'] = '/etc/php/5.6/fpm/php-fpm.conf'
node.default['php-fpm']['error_log'] = '/var/log/php5.6-fpm.log'
node.default['php-fpm']['pid'] = '/var/run/php/php5.6-fpm.pid'
include_recipe 'php-fpm::install'
php_fpm_pool "www" do
  listen "/var/run/php/php5.6-fpm.#{username}.sock"
  user username
  group username
  process_manager "dynamic"
  max_children 9
  min_spare_servers 2
  max_spare_servers 4
  start_servers 3
  max_requests 200
  php_options 'php_admin_flag[log_errors]' => 'on', 'php_admin_value[memory_limit]' => PHP_MEMORY_LIMIT
end
execute "sed -i -r 's/(; *)?memory_limit = .*/memory_limit = #{PHP_MEMORY_LIMIT}/g' /etc/php/5.6/fpm/php.ini" do
  not_if "grep '^memory_limit = #{PHP_MEMORY_LIMIT}' /etc/php/5.6/fpm/php.ini"
end
execute "sed -i -r 's/(; *)?max_execution_time = .*/max_execution_time = #{PHP_IDLE_TIMEOUT_SECONDS}/g' /etc/php/5.6/fpm/php.ini" do
  not_if "grep '^max_execution_time = #{PHP_IDLE_TIMEOUT_SECONDS}' /etc/php/5.6/fpm/php.ini"
end
execute "sed -i -r 's/(; *)?post_max_size = .*/post_max_size = #{PHP_POST_MAX_SIZE}/g' /etc/php/5.6/fpm/php.ini" do
  not_if "grep '^post_max_size = #{PHP_POST_MAX_SIZE}' /etc/php/5.6/fpm/php.ini"
end
execute "sed -i -r 's/(; *)?max_input_vars = .*/max_input_vars = #{PHP_MAX_INPUT_VARS}/g' /etc/php/5.6/fpm/php.ini" do
  not_if "grep '^max_input_vars = #{PHP_MAX_INPUT_VARS}' /etc/php/5.6/fpm/php.ini"
end
# Install mysqli for php. See:
#  http://stackoverflow.com/a/22525205
package "php5.6-mysql"
package "php5.6-mysqlnd-ms"
template "#{repo_root}/webroot/results/includes/_config.php" do
  source "results_config.php.erb"
  mode 0644
  owner username
  group username
  variables({
              secrets: secrets,
              db: db,
            })
end

#### Initialize rails gems/database
execute "bundle config set --local path '/home/#{username}/.bundle'" do
  user username
  cwd rails_root
  environment({
    "RACK_ENV" => rails_env,
  })
end
execute "bundle install #{'--deployment --without development test' if rails_env == 'production'}" do
  user username
  cwd rails_root
  environment({
                "RACK_ENV" => rails_env,
              })
end

if node.chef_environment == "development"
  db_setup_lockfile = '/tmp/rake-db-setup-run'
  execute "bundle exec rake db:setup" do
    cwd rails_root
    environment({
                  "DATABASE_URL" => db_url,
                  "RACK_ENV" => rails_env,
                })
    not_if { ::File.exist?(db_setup_lockfile) }
  end
  file db_setup_lockfile do
    action :create_if_missing
  end
elsif node.chef_environment == "staging"
  db_setup_lockfile = '/tmp/db-development-loaded'
  execute "bundle exec rake db:load:development" do
    cwd rails_root
    user username
    environment({
                  "DATABASE_URL" => db_url,
                  "RACK_ENV" => rails_env,
                })
    not_if { ::File.exist?(db_setup_lockfile) }
  end
  file db_setup_lockfile do
    action :create_if_missing
  end
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
