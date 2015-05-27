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
    class TarsnapKeyExport < Knife

      include Knife::Tarsnap::Core

      banner "knife tarsnap key export (options)"

      option :directory,
        :short => "-D DIRNAME",
        :long => "--directory DIRNAME",
        :default => File.join(Dir.getwd, "tarsnap-keys-#{Time.now.utc.to_i}"),
        :description => "Export into this local directory (default: tarsnap-keys-TIMESTAMP)"

      def run

        begin
          Dir.mkdir(config[:directory], 0700)
        rescue Errno::EEXIST => e
          # continue...
        end

        tarsnap_nodes.each do |n|
          keyfile = File.join(config[:directory], "#{n}.key")
          if confirm_overwrite?(keyfile)
            ui.msg "Exporting #{keyfile}"
            File.write(keyfile, fetch_key(n))
          end
        end

        ui.msg "Export finished!"

      end

      def confirm_overwrite?(file)
        return true if config[:yes]

        if File.exists?(file)
          stdout.print "Overwrite #{file}? (Y/N) "
          answer = stdin.readline
          answer.chomp!
          case answer
          when "Y", "y"
            true
          when "N", "n"
            self.msg("Skipping #{file}")
            false
          else
            self.msg("I have no idea what to do with #{answer}")
            self.msg("Just say Y or N, please.")
            confirm(question)
          end
        end
        true
      end

    end
  end
end
