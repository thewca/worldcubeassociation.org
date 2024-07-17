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

    def self.raw_static_data
      import_file = DATA_FOLDER.join("#{self.data_file_handle}.json")
      self.parse_json_file(import_file)
    end

    def self.static_data
      self.raw_static_data.map { |attributes| self.new(**attributes) }
    end
  end
end
