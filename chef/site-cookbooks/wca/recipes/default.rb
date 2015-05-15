require 'shellwords'
require 'securerandom'

include_recipe "wca::base"
include_recipe "nodejs"

secrets = data_bag_item("secrets", "all")

username, repo_root = UsernameHelper.get_username_and_repo_root(node)
if username == "cubing"
  if !node['etc']['passwd']['cubing']
    # Create cubing user if one does not already exist
    cmd = ["openssl", "passwd", "-1", secrets['cubing_password']].shelljoin
    hashed_pw = `#{cmd}`.strip
    user username do
      supports :manage_home => true
      home "/home/#{username}"
      shell '/bin/bash'
      password hashed_pw
    end

    # Trick to run code immediately and last copied from:
    #  https://gist.github.com/nvwls/7672039
    ruby_block 'last' do
      block do
        puts "#"*80
        puts "# Created user #{username} with password #{secrets['cubing_password']}"
        puts "#"*80
      end
    end
    ruby_block 'notify' do
      block do
        true
      end
      notifies :run, 'ruby_block[last]', :delayed
    end
  end

  ssh_known_hosts_entry 'github.com'
  chef_env_to_branch = {
    "dev" => "master",
    "staging" => "master",
    "production" => "production",
  }
  branch = chef_env_to_branch[node.chef_environment]
  git repo_root do
    repository "git@github.com:cubing/worldcubeassociation.org.git"
    revision branch
    # See http://lists.opscode.com/sympa/arc/chef/2015-03/msg00308.html
    # for the reason for checkout_branch and "enable_checkout false"
    checkout_branch branch
    enable_checkout false
    action :sync
    enable_submodules true

    # Unfortunately, setting the user and group breaks ssh agent forwarding.
    # Instead, let root user do the git checkout, and then chown appropriately.
    #user username
    #group username
    notifies :run, "execute[fix-permissions]", :immediately
  end
  execute "fix-permissions" do
    command "chown -R #{username}:#{username} #{repo_root}"
    user "root"
    action :nothing
  end
end
rails_root = "#{repo_root}/WcaOnRails"


#### Mysql
mysql_service 'default' do
  version '5.5'
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
execute "#{repo_root}/scripts/db.sh import /secrets/worldcubeassociation.org_alldbs.tar.gz"


#### Ruby and Rails
# Install native dependencies for gems
package 'libghc-zlib-dev'
package 'libsqlite3-dev'
package 'g++'
package 'libmysqlclient-dev'

node.default['brightbox-ruby']['version'] = "2.2"
# As a workaround for https://github.com/bundler/bundler/issues/3641, don't
# install the latest version of bundler, install 1.9.6 instead.
node.default['brightbox-ruby']['gems'] = [ 'rake', 'rubygems-bundler' ]
include_recipe "brightbox-ruby"
gem_package "bundler" do
  version "1.9.6"
end
gem_package "rails" do
  version "4.2.1"
end
chef_env_to_rails_env = {
  "dev" => "development",
  "staging" => "production",
  "production" => "production",
}
rails_env = chef_env_to_rails_env[node.chef_environment]


#### Nginx
package "nginx"
service 'nginx' do
  action [:enable, :start]
end
template "/etc/nginx/fcgi.conf" do
  source "fcgi.conf.erb"
  variables({
    username: username,
  })
  notifies :reload, "service[nginx]", :delayed
end
template "/etc/nginx/nginx.conf" do
  source "nginx.conf.erb"
  mode 0644
  owner 'root'
  group 'root'
  variables({
    username: username,
  })
  notifies :reload, "service[nginx]", :delayed
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
  })
  notifies :reload, "service[nginx]", :delayed
end
# The notifies we set up before do seem to work. I see stuff like this:
#  ==> default: [2015-05-10T21:54:13+00:00] INFO: file[/etc/nginx/sites-enabled/default] sending reload action to service[nginx] (delayed)
#  ==> default: [2015-05-10T21:54:13+00:00] INFO: service[nginx] reloaded
# However, the reload doesn't seem to actually have an effect!
# Hack around that here.
execute "nginx -s reload"


#### Rails secrets
template "#{rails_root}/.env.production" do
  source "env.production"
  mode 0644
  owner username
  group username
  variables({
    secrets: secrets,
  })
end

#### Legacy PHP results system
PHP_MEMORY_LIMIT = '512M'
PHP_IDLE_TIMEOUT_SECONDS = 120
include_recipe 'php-fpm::install'
php_fpm_pool "www" do
  listen "/var/run/php5-fpm.#{username}.sock"
  user username
  group username
  process_manager "dynamic"
  max_requests 5000
  php_options 'php_admin_flag[log_errors]' => 'on', 'php_admin_value[memory_limit]' => PHP_MEMORY_LIMIT
end
execute "sudo sed -i 's/memory_limit = .*/memory_limit = #{PHP_MEMORY_LIMIT}/g' /etc/php5/fpm/php.ini" do
  not_if "grep 'memory_limit = #{PHP_MEMORY_LIMIT}' /etc/php5/fpm/php.ini"
end
execute "sudo sed -i 's/max_execution_time = .*/max_execution_time = #{PHP_IDLE_TIMEOUT_SECONDS}/g' /etc/php5/fpm/php.ini" do
  not_if "grep 'max_execution_time = #{PHP_IDLE_TIMEOUT_SECONDS}' /etc/php5/fpm/php.ini"
end
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
template "#{repo_root}/webroot/results/admin/.htaccess" do
  source "results_admins.htaccess.erb"
  mode 0644
  owner username
  group username
  variables({
    secrets: secrets,
  })
end
template "/secrets/results_admins.htpasswd" do
  source "results_admins.htpasswd.erb"
  mode 0644
  owner username
  group username
  variables({
    secrets: secrets,
  })
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
