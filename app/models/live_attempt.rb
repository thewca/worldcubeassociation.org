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

  def self.compute_diff(before_attempts, after_attempts)
    before_hash = (before_attempts || []).index_by { |a| a[:id] }
    after_hash = (after_attempts || []).index_by { |a| a[:id] }

    diff = {}

    # Updated or created attempts
    updated = []
    after_hash.each do |id, after_attempt|
      before_attempt = before_hash[id]
      updated << after_attempt if before_attempt.nil? || before_attempt != after_attempt
    end
    diff[:updated] = updated if updated.any?

    # Deleted attempts
    deleted = before_hash.keys - after_hash.keys
    diff[:deleted] = deleted if deleted.any?

    diff.presence
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
