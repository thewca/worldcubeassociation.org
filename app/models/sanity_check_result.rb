# frozen_string_literal: true

class SanityCheckResult < ApplicationRecord
  belongs_to :sanity_check
  has_one :sanity_check_category, through: :sanity_check
  has_many :sanity_check_exclusions, through: :sanity_check

  delegate :topic, :comments, to: :sanity_check

  def cronjob_statistic
    CronjobStatistic.find(sanity_check_category.id)
  end

  def results_without_exclusions
    query_results.filter do |result|
      !sanity_check_exclusions.exists?(exclusion: result.to_json)
    end
  end
end
