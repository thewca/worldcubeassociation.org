require 'shellwords'

include_recipe "wca::base"
include_recipe "nodejs"

# Need dicitonary for password generation
package('wamerican').run_action(:install)

vagrant_user = node['etc']['passwd']['vagrant']
cubing_user = node['etc']['passwd']['cubing']
if vagrant_user
  username = "vagrant"
  rails_root = "/vagrant/WcaOnRails"
else
  username = "cubing"
  repo_root = "/home/#{username}/worldcubeassociation.org"
  rails_root = "#{repo_root}/WcaOnRails"

  if !node['etc']['passwd']['cubing']
    # Create cubing user if one does not already exist
    words = File.readlines("/usr/share/dict/words")
    xkcd_style_pw = words.sample(4).map(&:strip).join('-')
    cmd = ["openssl", "passwd", "-1", xkcd_style_pw].shelljoin
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
        puts "# Created user #{username} with password #{xkcd_style_pw}"
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


#### Mysql
mysql_service 'default' do
  version '5.5'
  initial_root_password 'root'
  action [:create, :start]
end
mysql_config 'default' do
  source 'mysql-wca.cnf.erb'
  notifies :restart, 'mysql_service[default]'
  action :create
end
template "/home/#{username}/.my.cnf" do
  source "my.cnf.erb"
  mode 0644
  owner username
  group username
end


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
file "/etc/nginx/sites-enabled/default" do
  action :delete
  manage_symlink_source true
  notifies :reload, "service[nginx]", :delayed
end
template "/etc/nginx/conf.d/worldcubeassociation.org.conf" do
  source "worldcubeassociation.org.conf.erb"
  mode 0644
  owner 'root'
  group 'root'
  variables({
    rails_root: rails_root,
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


#### Screen
template "/home/#{username}/.bash_profile" do
  source "bash_profile.erb"
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
# is /home/root, for instance)
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
