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

username, repo_root = WcaHelper.get_username_and_repo_root(self)
rails_root = "#{repo_root}/WcaOnRails"

#### Mysql
package 'mysql-client-8.0'
db = {
  'user' => 'root',
}
if node.chef_environment == "production"
  # In production mode, we use Amazon RDS.
  db['host'] = "worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
  db['read_replica'] = "readonly-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
elsif node.chef_environment == "staging"
  # In staging mode, we use Amazon RDS.
  db['host'] = "staging-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
  db['read_replica'] = "readonly-staging-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
end
read_replica = db["read_replica"]

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
  redis[:cache_host] = "wca-main-cache-001.iebvzt.0001.usw2.cache.amazonaws.com"
  redis[:sidekiq_host] = "wca-main-sidekiq-001.iebvzt.0001.usw2.cache.amazonaws.com"
elsif node.chef_environment == "staging"
  # In staging mode, we use Amazon ElasticCache.
  redis[:cache_host] = "redis-main-staging-001.iebvzt.0001.usw2.cache.amazonaws.com"

  # Yes, in staging mode we dump the cache and Sidekiq jobs to the same Redis instance.
  redis[:sidekiq_host] = redis[:cache_host]
end

cache_redis_url = "redis://#{redis[:cache_host]}:#{redis[:port]}"
sidekiq_redis_url = "redis://#{redis[:sidekiq_host]}:#{redis[:port]}"

#### Rails environment
# Secrets are handled using Hashicorp Vault
template "#{rails_root}/.env.production" do
  source "env.production.erb"
  mode 0644
  owner username
  group username
  variables({
              cache_redis_url: cache_redis_url,
              sidekiq_redis_url: sidekiq_redis_url,
              db_host: db["host"],
              read_replica_host: db["read_replica"]
            })
end

#### phpMyAdmin
package "phpmyadmin" do
  # skipping recommends because otherwise it will install an entire apache2 server…
  options ["--no-install-recommends"]
end

package "php-fpm"

# Download certificate bundle for the RDS database
rds_certificate_pem = '/etc/phpmyadmin/rds-combined-ca-bundle.pem'
execute "wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem -O ${rds_certificate_pem}" do
  not_if { ::File.exist?(rds_certificate_pem) }
end

template "etc/phpmyadmin/conf.d/wca.php" do
  source "phpMyAdmin_config.inc.php.erb"
  variables({
              rds_certificate_pem: rds_certificate_pem,
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

### Sidekiq
template "/etc/systemd/user/sidekiq.service" do
  source "sidekiq.service.erb"
  variables({
              username: username,
              repo_root: repo_root,
            })
end
execute "start-sidekiq" do
  command "systemctl --user sidekiq start"
  not_if "ps -efw | grep sidekiq"
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
