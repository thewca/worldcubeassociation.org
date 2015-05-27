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
    class TarsnapBackupShow < Knife

      include Knife::Tarsnap::Core

      banner "knife tarsnap backup show NODE [ARCHIVE] (options)"

      def run

        node_name = name_args.first
        if name_args.size == 2
          archive_name = name_args.last
        elsif name_args.size == 1
          archive_name = nil
        else
          ui.fatal "Must provide only NODE and an option ARCHIVE."
          exit 1
        end

        Tempfile.open('tarsnap', '/tmp') do |f|
          key = fetch_key(node_name)
          f.write(key)
          f.close

          if archive_name.nil?
            list_cmd = "#{tarsnap_tool} --keyfile #{f.path} --list-archives" 
          else
            list_cmd = "#{tarsnap_tool} -t --keyfile #{f.path} -f #{archive_name}"
          end

          list_shell = Mixlib::ShellOut.new(list_cmd, :environment => {'LC_ALL'=>nil})
          list_shell.run_command
          unless list_shell.stderr.empty?
            raise StandardError, "tarsnap error: #{list_shell.stderr}"
          end
          list_shell.stdout.split("\n").sort.each { |l| ui.msg l }
        end

      end

    end
  end
end
