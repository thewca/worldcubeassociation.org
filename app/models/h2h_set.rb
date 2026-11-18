# frozen_string_literal: true

class H2hSet < ApplicationRecord
  # Touching the match lets the match's `updated_at` stand in for its sets and attempts in ETags.
  belongs_to :h2h_match, touch: true
  has_many :h2h_attempts, dependent: :destroy

  alias_method :attempts, :h2h_attempts

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[set_number],
    methods: %w[attempts],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
