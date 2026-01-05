# frozen_string_literal: true

class SanityCheck < ApplicationRecord
  include StaticData

  belongs_to :sanity_check_category

  def query
    @query ||= Rails.root.join("lib", "sanity_check_sql", "#{sanity_check_category.id} - #{sanity_check_category.name.gsub(/\s+/, "").underscore}", "#{self.id} - #{self.query_file}").read
  end
end
