# frozen_string_literal: true

class SanityCheck < ApplicationRecord
  include StaticData

  belongs_to :sanity_check_category

  def query
    category_folder = "#{sanity_check_category.id} - #{sanity_check_category.camel_case_name.underscore}"
    file_name = "#{self.id} - #{self.query_file}"
    @query ||= Rails.root.join("lib", "sanity_check_sql", category_folder, file_name).read
  end
end
