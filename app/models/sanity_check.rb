# frozen_string_literal: true

class SanityCheck < ApplicationRecord
  include StaticData
  has_one :sanity_check_category

  def self.data_file_handle
    "#{self.name.pluralize.underscore}.json"
  end

  # Overwrite method to handle .sql files
  def self.all_raw_sanitized
    column_symbols = column_names.map(&:to_sym)

    all_raw.map do |attributes|
      attrs = attributes.symbolize_keys
      attrs[:query] = File.read(Rails.root.join("lib","sanity_check_sql", attrs[:query_file]))
      delete attrs[:query_file]

      attrs.slice(*column_symbols)
    end
  end
end
