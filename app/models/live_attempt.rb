# frozen_string_literal: true

class LiveAttempt < ApplicationRecord
  include Comparable

  belongs_to :live_result
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

  def update_with_history_entry(r, current_user)
    update(result: r)
    live_attempt_history_entries.create({
                                          result: r,
                                          entered_at: Time.now.utc,
                                          entered_by: current_user,
                                        })
    self
  end
end
