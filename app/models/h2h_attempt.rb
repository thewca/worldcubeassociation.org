# frozen_string_literal: true

class H2hAttempt < ApplicationRecord
  belongs_to :h2h_match_competitor
  belongs_to :h2h_set
  belongs_to :live_attempt, optional: true
  belongs_to :result_attempt, optional: true

  def to_h2h_json
    {
      user_id: h2h_match_competitor.user_id,
      set_attempt_number: set_attempt_number,
      value: result_attempt&.value || live_attempt&.value,
    }
  end
end
