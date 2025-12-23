# frozen_string_literal: true

class SanityCheckCategory < ApplicationRecord
  include StaticData
  has_many :sanity_checks
  has_many :sanity_check_results, through: :sanity_checks

  def self.data_file_handle
    "#{self.name.pluralize.underscore}"
  end

  # This is currently quite easy but inefficient.
  # This can be solved with a window function if needed
  # Something like:
  # SanityCheckResult
  #     .joins(:sanity_check)
  #     .where(sanity_checks: { sanity_check_category_id: id })
  #     .select('sanity_check_results.*,
  #              ROW_NUMBER() OVER (
  #                PARTITION BY sanity_check_results.sanity_check_id
  #                ORDER BY sanity_check_results.created_at DESC
  #              ) AS row_number')
  #     .where('row_number = 1')
  def latest_results
    sanity_checks.map { |s | s.latest_results }.flatten
  end
end
