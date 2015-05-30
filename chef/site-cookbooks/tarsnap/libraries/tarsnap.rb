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


module TarsnapHelpers
  def unmash(mashed)
    # XXX: This might be the grossest thing I've ever written
    begin
      mashed.to_hash.map { |k,v| { k => v.to_a.map { |kk| kk = kk.to_hash } }}
    rescue NoMethodError => e
      nil
    end
  end

  def lookup_node_entry(entry_type, entry_name)
    begin
      node['tarsnap'][entry_type][entry_name]
    rescue NoMethodError => e
      nil
    end
  end

  def update_config_file
    begin
      feather_template = resource_collection.find(:template => "#{node['tarsnap']['conf_dir']}/feather.yaml")
      feather_template.variables(
        :backups => unmash(node['tarsnap']['backups']),
        :schedules => unmash(node['tarsnap']['schedules'])
      )
    rescue Chef::Exceptions::ResourceNotFound
      feather_template = template "#{node['tarsnap']['conf_dir']}/feather.yaml" do
        variables(
          :backups => unmash(node['tarsnap']['backups']),
          :schedules => unmash(node['tarsnap']['schedules'])
        )
        cookbook "tarsnap"
        action :nothing
      end
    end

    feather_template.notifies(:create, "template[#{node['tarsnap']['conf_dir']}/feather.yaml]", :delayed)
  end
end
