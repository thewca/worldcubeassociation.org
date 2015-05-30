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
    class TarsnapBackupDump < Knife

      include Knife::Tarsnap::Core

      banner "knife tarsnap backup dump NODE ARCHIVE PATTERN (options)"

      option :directory,
        :short => "-D DIRNAME",
        :long => "--directory DIRNAME",
        :description => "Retrieve matching files into this local directory"

      def run

        if name_args.size == 3
          node_name = name_args[0]
          archive_name = name_args[1]
          filename = name_args.last
        else
          ui.fatal "Incorrect number of options provided"
          exit 1
        end

        Tempfile.open('tarsnap', '/tmp') do |f|
          key = fetch_key(node_name)
          f.write(key)
          f.close

          if config[:directory]
            dump_cmd = "#{tarsnap_tool} --keyfile #{f.path} -x -f #{archive_name} -C #{config[:directory]} --include '#{filename}'"
          else
            dump_cmd = "#{tarsnap_tool} --keyfile #{f.path} -x -f #{archive_name} -O --include '#{filename}'"
          end
          dump_shell = Mixlib::ShellOut.new(dump_cmd, :timeout => 604800, :environment => {'LC_ALL'=>nil})
          dump_shell.run_command
          unless dump_shell.status.exitstatus == 0
            raise StandardError, "tarsnap error: #{dump_shell.stderr}"
          end
          ui.msg dump_shell.stdout
        end

      end

    end
  end
end
