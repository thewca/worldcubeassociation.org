# frozen_string_literal: true

class SanityCheck < ApplicationRecord
  include StaticData

  belongs_to :sanity_check_category

  # Overwrite method to handle .sql files
  def self.all_raw_sanitized
    column_symbols = column_names.map(&:to_sym)

    all_raw.map do |attributes|
      attrs = attributes.symbolize_keys
      attrs[:query] = Rails.root.join("lib", "sanity_check_sql", attrs[:query_file]).read

      attrs.slice(*column_symbols)
    end
  end
end
