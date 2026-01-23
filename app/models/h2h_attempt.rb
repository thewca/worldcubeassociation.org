# frozen_string_literal: true

class H2hAttempt < ApplicationRecord
  belongs_to :h2h_match_competitor
  belongs_to :h2h_set
  belongs_to :live_attempt, optional: true
  belongs_to :result_attempt, optional: true
end
