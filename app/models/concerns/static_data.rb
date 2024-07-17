# frozen_string_literal: true

module StaticData
  extend ActiveSupport::Concern

  DATA_FOLDER = Rails.root.join('lib/static_data')

  class_methods do
    def parse_json_file(file_path, symbolize_names: true)
      ::JSON.parse(File.read(file_path), symbolize_names: symbolize_names)
    end
  end

  included do
    def self.data_file_handle
      self.name.pluralize.underscore
    end

    def self.static_json_data
      import_file = DATA_FOLDER.join("#{self.data_file_handle}.json")
      self.parse_json_file(import_file)
    end

    def self.all_raw
      self.static_json_data
    end

    def self.all_static
      self.all_raw.map do |attributes|
        column_attributes = attributes.slice(*self.column_names)
        self.new(**column_attributes)
      end
    end

    def self.dump_static
      self.all.as_json
    end
  end
end
