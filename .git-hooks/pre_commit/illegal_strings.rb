# frozen_string_literal: true

module Overcommit::Hook::PreCommit
  class IllegalStrings < Base
    def run
      errors = []

      illegal_strs = {
        ("<" * 3) => "conflict marker",
        "\t" => "tab",
        "\r" => "carriage return",
        "\uFEFF" => "byte order marker (BOM)",
        "WCA id" => "We prefer 'WCA ID', see https://github.com/thewca/worldcubeassociation.org/issues/268",
      }
      applicable_files.each do |file|
        File.foreach(file).with_index do |line, line_num|
          illegal_strs.each do |illegal_str, description|
            index = line.index illegal_str
            if index
              errors << "#{file}:#{line_num+1}:#{index+1} Found illegal string: #{description}"
            end
          end
        end
      end

      return :fail, errors.join("\n") if errors.any?

      :pass
    end
  end
end
