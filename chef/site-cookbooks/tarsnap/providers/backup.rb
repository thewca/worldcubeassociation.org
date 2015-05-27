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


include TarsnapHelpers

action :create do

  needs_config_update = false

  backup_entry = [
    { "schedule" => new_resource.schedule },
    { "path" => [new_resource.path].flatten }
  ]
  backup_entry.push({"exclude" => new_resource.exclude}) if new_resource.exclude

  existing_entry = lookup_node_entry('backups', new_resource.name)

  if existing_entry.nil? || backup_entry != existing_entry
    node.set['tarsnap']['backups'][new_resource.name] = backup_entry
    new_resource.updated_by_last_action(true)
    node.save unless Chef::Config[:solo]
    update_config_file
    new_resource.updated_by_last_action(true)
  end
end

action :delete do
  node['tarsnap']['backups'].delete(new_resource.name)
  node.save unless Chef::Config[:solo]
  update_config_file
  new_resource.updated_by_last_action(true)
end
