# frozen_string_literal: true

class SanityCheck < ApplicationRecord
  include StaticData

  belongs_to :sanity_check_category
  has_many :sanity_check_results
  has_many :sanity_check_exclusions
  belongs_to :latest_result, class_name: "SanityCheckResult"

  def file_handle
    "#{self.id} - #{self.query_file}"
  end

  def query
    @query ||= Rails.root.join("lib", "sanity_check_sql", sanity_check_category.folder_handle, file_handle).read
  end

  def run_query
    ActiveRecord::Base.connection.exec_query self.query
  end
end
