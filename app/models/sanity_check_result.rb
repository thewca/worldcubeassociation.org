# frozen_string_literal: true

class SanityCheckResult < ApplicationRecord
  belongs_to :sanity_check
  has_one :sanity_check_category, through: :sanity_check
  belongs_to :cronjob_statistic
end
