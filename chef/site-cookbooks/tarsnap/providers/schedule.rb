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

  schedule_entry = [
    { "period" => new_resource.period },
    { "always_keep" => new_resource.always_keep }
  ]

  schedule_entry.push({"after" => new_resource.after}) if new_resource.after
  schedule_entry.push({"before" => new_resource.before}) if new_resource.before
  schedule_entry.push({"implies" => new_resource.implies}) if new_resource.implies

  existing_entry = lookup_node_entry('schedules', new_resource.name)

  if existing_entry.nil? || schedule_entry != existing_entry
    node.set['tarsnap']['schedules'][new_resource.name] = schedule_entry
    new_resource.updated_by_last_action(true)
    node.save unless Chef::Config[:solo]
    update_config_file
    new_resource.updated_by_last_action(true)
  end
end

action :delete do
  node['tarsnap']['schedules'].delete(new_resource.name)
  node.save unless Chef::Config[:solo]
  update_config_file
  new_resource.updated_by_last_action(true)
end
