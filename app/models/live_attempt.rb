# frozen_string_literal: true

class LiveAttempt < ApplicationRecord
  include Comparable

  default_scope { order(:attempt_number) }

  belongs_to :live_result
  has_many :live_attempt_history_entries, dependent: :destroy

  validates :value, presence: true
  validates :value, numericality: { only_integer: true }
  validates :attempt_number, numericality: { only_integer: true }

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[attempt_number value],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end

  def <=>(other)
    value <=> other.value
  end

  def to_result_attempt
    ResultAttempt.new(value: value, attempt_number: attempt_number)
  end

  def self.build_with_history_entry(value, attempt_number, acting_user)
    LiveAttempt.build(
      value: value,
      attempt_number: attempt_number,
      live_attempt_history_entries: [
        LiveAttemptHistoryEntry.build(
          value: value,
          entered_at: Time.now.utc,
          entered_by: acting_user,
        ),
      ],
    )
  end

  def self.attempts_changed?(before_attempts, after_attempts)
    Set.new(before_attempts) != Set.new(after_attempts)
  end

  def update_with_history_entry(value, acting_user)
    self.update(value: value)
    self.live_attempt_history_entries.create(
      value: value,
      entered_at: Time.now.utc,
      entered_by: acting_user,
    )

    # Return `self` for method chaining
    self
  end
end
