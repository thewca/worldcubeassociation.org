# Author:: Scott Sanders (scott@jssjr.com)
# Copyright:: Copyright (c) 2013 Scott Sanders
# License:: Apache License, Version 2.0
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


class Chef::Resource::Template
  include TarsnapHelpers
end

require 'mixlib/shellout'

bin_cmd = File.join(node['tarsnap']['bin_path'], "tarsnap")
current_version = Mixlib::ShellOut.new("#{bin_cmd} --version")
latest_version = node["tarsnap"]["version"]

# Install tarsnap
case node['platform']
when "freebsd"
  package "tarsnap" do
    action :install
  end
else
  unless ::File.exists?(bin_cmd) && 
    current_version.run_command.stdout.split[1] == latest_version

    require 'digest'

    node['tarsnap']['install_packages'].each do |pkg|
      package pkg do
        action :install
      end
    end

    remote_file "tarsnap" do
      path "#{Chef::Config[:file_cache_path]}/tarsnap.tgz"
      checksum node['tarsnap']['sha256']
      source "https://www.tarsnap.com/download/tarsnap-autoconf-#{node['tarsnap']['version']}.tgz"
    end

    execute "extract-tarsnap" do
      command "cd #{Chef::Config[:file_cache_path]} && tar zxvf tarsnap.tgz"
      creates "#{Chef::Config[:file_cache_path]}/tarsnap-autoconf-#{node['tarsnap']['version']}"
    end

    execute "install-tarsnap" do
      command "cd #{Chef::Config[:file_cache_path]}/tarsnap-autoconf-#{node['tarsnap']['version']} && ./configure && make install clean"
      only_if { Digest::SHA256.file(File.join(Chef::Config[:file_cache_path],'tarsnap.tgz')).hexdigest == node['tarsnap']['sha256'] }
    end

  end
end

# Create the local cache directory
directory node['tarsnap']['cachedir'] do
  if node['tarsnap']['cachedir_file_owner'] #JFLY
    owner node['tarsnap']['cachedir_file_owner']
  else #JFLY
    owner "root"
  end #JFLY
  mode 0700
  recursive true
  action :create
end

# Setup the local copy of the key
#JFLY tarsnap_key node['fqdn'] do
tarsnap_key node['tarsnap']['key_name'] do
  data_bag node['tarsnap']['data_bag']
  key_path node['tarsnap']['key_path']
  key_file node['tarsnap']['key_file']
  #JFLY
  if node['tarsnap']['key_file_owner']
    owner node['tarsnap']['key_file_owner']
  end
  if node['tarsnap']['key_file_group']
    group node['tarsnap']['key_file_group']
  end
  #JFLY
  action :create_if_missing
end

# Install feather
#JFLY remote_file File.join(node['tarsnap']['bin_path'], 'feather') do
  #JFLY source "https://github.com/danrue/feather/raw/master/feather"
  #JFLY owner 'root'
  #JFLY mode '0755'
#JFLY end

#JFLY node['tarsnap']['packages'].each do |pkg|
  #JFLY package pkg do
    #JFLY action :install
  #JFLY end
#JFLY end

#JFLY template "#{node['tarsnap']['conf_dir']}/feather.yaml" do
  #JFLY source "feather.yaml.erb"
  #JFLY owner "root"
  #JFLY mode "0644"
  #JFLY action :create
  #JFLY variables(
    #JFLY :backups => unmash(node['tarsnap']['backups']),
    #JFLY :schedules => unmash(node['tarsnap']['schedules'])
  #JFLY )
#JFLY end

template "#{node['tarsnap']['conf_dir']}/tarsnap.conf" do
  source "tarsnap.conf.erb"
  owner "root"
  mode "0644"
  action :create
end

#JFLY cron "feather" do
  #JFLY minute node['tarsnap']['cron']['minute']
  #JFLY hour node['tarsnap']['cron']['hour']
  #JFLY path "#{node['tarsnap']['bin_path']}:/usr/bin:/bin"
  #JFLY command "#{node['tarsnap']['bin_path']}/feather #{node['tarsnap']['conf_dir']}/feather.yaml"
#JFLY end

#JFLY if node['tarsnap']['use_default_schedule']
  #JFLY include_recipe "tarsnap::default_schedule"
#JFLY end
