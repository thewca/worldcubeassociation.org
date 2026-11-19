# frozen_string_literal: true

class H2hAttempt < ApplicationRecord
  belongs_to :h2h_match_competitor
  belongs_to :h2h_set
  belongs_to :live_attempt, optional: true
  belongs_to :result_attempt, optional: true

  delegate :user_id, to: :h2h_match_competitor

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[set_attempt_number],
    methods: %w[user_id value],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end

  def value
    result_attempt&.value || live_attempt&.value
  end
end
