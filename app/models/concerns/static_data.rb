# frozen_string_literal: true

module StaticData
  extend ActiveSupport::Concern

  class_methods do
    def parse_json_file(file_path)
      ::JSON.parse(File.read(file_path))
    end
  end

  included do
    def self.import_filename
      "#{self.name.pluralize.underscore}.json"
    end

    def self.raw_static_data
      import_file = StaticDataLoader::STATIC_DATA_FOLDER.join(self.import_filename)
      self.parse_json_file(import_file)
    end

    def self.static_data
      self.raw_static_data.map { |attributes| self.new(**attributes) }
    end
  end
end
