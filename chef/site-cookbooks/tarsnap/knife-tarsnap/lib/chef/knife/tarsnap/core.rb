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

class Chef
  class Knife
    class Tarsnap
      module Core

        # :nodoc:
        # Would prefer to do this in a rational way, but can't be done b/c of
        # Mixlib::CLI's design :(
        def self.included(includer)
          includer.class_eval do

            deps do
              require 'chef/knife'
              require 'chef/shell/ext'
              Chef::Knife.load_deps
            end

            option :tarsnap_username,
              :short => "-A USERNAME",
              :long => "--tarsnap-username KEY",
              :description => "Your Tarsnap Username",
              :proc => Proc.new { |key| Chef::Config[:knife][:tarsnap_username] = key }

            option :tarsnap_password,
              :short => "-K SECRET",
              :long => "--tarsnap-password SECRET",
              :description => "Your Tarsnap Password",
              :proc => Proc.new { |key| Chef::Config[:knife][:tarsnap_password] = key }

            option :tarsnap_data_bag,
              :short => "-B BAG_NAME",
              :long => "--tarsnap-data-bag BAG_NAME",
              :description => "The data bag containing Tarsnap keys",
              :proc => Proc.new { |key| Chef::Config[:knife][:tarsnap_data_bag] = key },
              :default => "tarsnap_keys"

          end
        end

        ## Convenience methods for options

        # Returns the tarsnap account username or throw an exception.
        def tarsnap_username
          if Chef::Config[:knife][:tarsnap_username]
            Chef::Config[:knife][:tarsnap_username]
          else
            raise StandardError, "Please provide the tarsnap account username"
          end
        end

        # Returns the tarsnap account password, or prompt the user for input.
        def tarsnap_password
          if Chef::Config[:knife][:tarsnap_password].nil?
            Chef::Config[:knife][:tarsnap_password] = ui.ask('Tarsnap Password: ') { |q| q.echo = '*' }
          end
          Chef::Config[:knife][:tarsnap_password]
        end

        # Returns the name of the data bag used to store tarsnap keys.
        def tarsnap_data_bag
          Chef::Config[:knife][:tarsnap_data_bag] || config[:tarsnap_data_bag]
        end

        ## Required tools

        # Returns the path of the tarsnap-keygen command line binary.
        def keygen_tool
          @_keygen_path || @_keygen_path = which('tarsnap-keygen')
        end

        # Returns the path of the tarsnap command line binary.
        def tarsnap_tool
          @_tarsnap_path || @_tarsnap_path = which('tarsnap')
        end

        ## Helpers

        # Normalize the FQDN by replacing dots (.) with underscores (_).
        def canonicalize(fqdn)
          fqdn.gsub(".","_")
        end

        # Return the list of nodes from the data bag marked as pending.
        def pending_nodes
          Shell::Extensions.extend_context_object(self)
          @_pending_nodes || @_pending_nodes =
            nodes.find('tarsnap_pending:true').map{|n| n.fqdn}
        end

        # Return the list of nodes from the data bag marked as having keys.
        def tarsnap_nodes
          @_tarsnap_nodes || @_tarsnap_nodes =
            Chef::DataBag.load(tarsnap_data_bag).keep_if{|k,v| k !~ /^__/}.map{|k,v| k.gsub("_",".")}
        end

        # Convenience method for returning a Chef::Node object from its FQDN.
        def fetch_node(fqdn)
          Shell::Extensions.extend_context_object(self)
          nodes.find("fqdn:#{fqdn}").first
        end

        # Returns the tarsnap key for a given node's FQDN.
        def fetch_key(fqdn)
          bag_item = fetch_tarsnap_bag_item(fqdn)
          if bag_item
            bag_item['key']
          else
            nil
          end
        end

        # Returns a boolean indicating if the node has a tarsnap key and is ready for use, or not.
        def is_a_tarsnap_node?(fqdn)
          tarsnap_nodes.include?(fqdn)
        end

        # Remove the data bag entry for a pending node.
        def remove_pending_node(fqdn)
          n = nodes.find("fqdn:#{fqdn}").first
          n.set.delete('tarsnap_pending')
          n.save
        end

        private

        # Returns the path for the requested binary.
        def which(binary)
          which_cmd = "which #{binary}"
          which_shell = Mixlib::ShellOut.new(which_cmd)
          which_shell.run_command
          unless which_shell.status.exitstatus == 0
            raise StandardError, "Unable to locate the tarsnap tool (#{binary}). Is it installed and in your path?"
          end
          which_shell.stdout.chomp
        end

        # Fetch the tarsnap keys data bag item for a node and return it.
        def fetch_tarsnap_bag_item(fqdn)
          begin
            Chef::EncryptedDataBagItem.load(tarsnap_data_bag, canonicalize(fqdn))
          rescue Net::HTTPServerException => e
            nil
          end
        end

      end
    end
  end
end
