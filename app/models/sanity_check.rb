# frozen_string_literal: true

class SanityCheck < ApplicationRecord
  include StaticData

  belongs_to :sanity_check_category

  def file_handle
    "#{self.id} - #{self.query_file}"
  end

  def query
    @query ||= Rails.root.join("lib", "sanity_check_sql", sanity_check_category.folder_handle, file_handle).read
  end
end
