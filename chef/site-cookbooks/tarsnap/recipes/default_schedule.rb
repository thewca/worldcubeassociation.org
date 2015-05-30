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


include_recipe "tarsnap"

tarsnap_schedule "monthly" do
  period 2592000 # 30 days
  always_keep 12
  before "0600"
end

tarsnap_schedule "weekly" do
  period 604800 # 7 days
  always_keep 6
  after "0200"
  before "0600"
  implies "monthly"
end

tarsnap_schedule "daily" do
  period 86400 # 1 day
  always_keep 14
  after "0200"
  before "0600"
  implies "weekly"
end

tarsnap_schedule "hourly" do
  period 3600 # 1 hour
  always_keep 24
  implies "daily"
end

tarsnap_schedule "realtime" do
  period 900 # 15 minutes
  always_keep 10
  implies "hourly"
end
