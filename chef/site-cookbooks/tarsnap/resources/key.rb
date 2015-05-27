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


def initialize(*args)
  super
  @action = :create
end

actions :create, :create_if_missing

attribute :data_bag, :kind_of => String, :default => "tarsnap_keys"
attribute :search_id, :kind_of => String, :name_attribute => true

attribute :key_path, :kind_of => String, :default => "/root"
attribute :key_file, :kind_of => String, :default => "tarsnap.key"

attribute :owner, :kind_of => String, :default => "root"
attribute :group, :kind_of => String, :default => ""  # will be selected in the provider

attribute :cookbook, :kind_of => String, :default => "tarsnap"
