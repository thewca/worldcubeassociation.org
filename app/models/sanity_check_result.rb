# frozen_string_literal: true

class SanityCheckResult < ApplicationRecord
  belongs_to :sanity_check
  has_one :sanity_check_category, through: :sanity_check
  has_many :sanity_check_exclusions, through: :sanity_check
  belongs_to :cronjob_statistic

  delegate :topic, :comments, to: :sanity_check
end
