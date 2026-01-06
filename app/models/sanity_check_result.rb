# frozen_string_literal: true

class SanityCheckResult < ApplicationRecord
  belongs_to :sanity_check
  has_one :sanity_check_category, through: :sanity_check
  has_many :sanity_check_exclusions, through: :sanity_check

  delegate :topic, :comments, to: :sanity_check

  after_create :update_latest_result

  def update_latest_result
    sanity_check.update_columns(latest_result_id: self.id)
  end

  def cronjob_statistic
    CronjobStatistic.find(sanity_check_category.snake_case_name)
  end

  def results_without_exclusions
    query_results.filter do |result|
      sanity_check_exclusions.any? { |exclusion| exclusion.excludes?(result) }
    end
  end
end
