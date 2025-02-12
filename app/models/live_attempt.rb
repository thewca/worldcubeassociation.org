# frozen_string_literal: true

class LiveAttempt < ApplicationRecord
  include Comparable

  belongs_to :live_result
  validate :needs_live_result_or_replaced_by
  has_many :live_attempt_history_entries, dependent: :destroy

  validates :result, presence: true
  validates :result, numericality: { only_integer: true }
  validates :attempt_number, numericality: { only_integer: true }

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[attempt_number result],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end

  def <=>(other)
    result <=> other.result
  end
end
