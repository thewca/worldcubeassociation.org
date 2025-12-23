# frozen_string_literal: true

class SanityCheckResult < ApplicationRecord
  has_one :sanity_check
  has_one :sanity_check_category, through: :sanity_check
  has_one :cronjob_statistic
end
