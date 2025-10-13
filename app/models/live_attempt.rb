# frozen_string_literal: true

class LiveAttempt < ApplicationRecord
  include Comparable

  default_scope { order(:attempt_number) }

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

  def self.build_with_history_entry(result, attempt_number, acting_user)
    LiveAttempt.build(
      result: result,
      attempt_number: attempt_number,
      live_attempt_history_entries: [
        LiveAttemptHistoryEntry.build(
          result: result,
          entered_at: Time.now.utc,
          entered_by: acting_user,
        ),
      ],
    )
  end

  def update_with_history_entry(result, acting_user)
    self.update(result: result)
    self.live_attempt_history_entries.create(
      result: result,
      entered_at: Time.now.utc,
      entered_by: acting_user,
    )

    # Return `self` for method chaining
    self
  end
end
