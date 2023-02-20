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
package "nginx"

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

### Redis
redis = {
  port: 6379
}

if node.chef_environment == "production"
  # In production mode, we use Amazon ElasticCache.
  redis['host'] = "redisprod.iebvzt.ng.0001.usw2.cache.amazonaws.com"
elsif node.chef_environment == "staging"
  # In staging mode, we use Amazon ElasticCache.
  redis['host'] = "redisstaging.iebvzt.ng.0001.usw2.cache.amazonaws.com"
end

redis_url = "redis://#{redis['host']}:#{redis['port']}"

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
              db_host: db["host"],
              read_replica_host: read_replica
            })
end

#### phpMyAdmin
package "phpmyadmin" do
  # skipping recommends because otherwise it will install an entire apache2 server…
  options ["--no-install-recommends"]
end

package "php-fpm"

template "etc/phpmyadmin/conf.d/wca.php" do
  source "phpMyAdmin_config.inc.php.erb"
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
                  "DATABASE_HOST" => db["host"],
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
                  "DATABASE_HOST" => db["host"],
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
              db_host: db["host"],
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
