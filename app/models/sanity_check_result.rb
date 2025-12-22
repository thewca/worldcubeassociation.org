# frozen_string_literal: true

class SanityCheckResult < ApplicationRecord
  has_one :sanity_check_category
  has_one :cronjob_statistic
end
