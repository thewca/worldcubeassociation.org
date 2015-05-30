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

require 'chef/knife/tarsnap/core'

class Chef
  class Knife
    class TarsnapKeyFromFile < Knife

      include Knife::Tarsnap::Core

      banner "knife tarsnap key from file KEYFILE NODE (options)"

      def run

        unless name_args.size == 2
          ui.fatal "You must provide a key file and a node name"
          exit 1
        end

        k = name_args.first
        n = name_args.last

        match = fetch_node(n)
        unless match.is_a? Chef::Node
          ui.fatal "#{n} is not a node. Skipping..."
          exit 1
        end

        existing_key = fetch_key(n)
        if existing_key
          ui.warn "A key for #{n} already exists! Overwrite it with a new key?"
          ui.warn "The old key will be saved to #{ENV['HOME']}/tarsnap.#{n}.key.old"
          ui.confirm "Continue"
          IO.write("#{ENV['HOME']}/tarsnap.#{n}.key.old", existing_key)
        end

        begin
          data = { "id" => canonicalize(n), "node" => n, "key" => IO.read(k) }
          secret = Chef::EncryptedDataBagItem.load_secret(config[:secret_file])
          item = Chef::EncryptedDataBagItem.encrypt_data_bag_item(data, secret)
          data_bag = Chef::DataBagItem.new
          data_bag.data_bag(tarsnap_data_bag)
          data_bag.raw_data = item
          data_bag.save

          remove_pending_node(n)

          ui.info ui.color("Data bag created from file!", :green)
        rescue Exception => e
          ui.msg "Error: #{e}"
          ui.warn ui.color("Key creation failed!", :red)
          exit 1
        end

      end

    end
  end
end
