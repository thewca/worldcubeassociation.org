# frozen_string_literal: true

class SanityCheck < ApplicationRecord
  include StaticData

  belongs_to :sanity_check_category
  has_many :sanity_check_results
  has_many :sanity_check_exclusions

  def latest_results
    sanity_check_results.order(created_at: :desc).first
  end

  def file_handle
    "#{self.id} - #{self.query_file}"
  end

  def query
    @query ||= Rails.root.join("lib", "sanity_check_sql", sanity_check_category.folder_handle, file_handle).read
  end
end
