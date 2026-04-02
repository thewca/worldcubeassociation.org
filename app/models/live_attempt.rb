# frozen_string_literal: true

class LiveAttempt < ApplicationRecord
  include Comparable

  default_scope { order(:attempt_number) }

  belongs_to :live_result, counter_cache: true

  has_one :h2h_attempt, dependent: :destroy

  validates :value,
            presence: true,
            numericality: { only_integer: true, other_than: 0 }
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

  def self.attempts_changed?(before_attempts, after_attempts)
    Set.new(before_attempts) != Set.new(after_attempts)
  end

  def to_wcif
    { "value" => self.value, "reconstruction" => nil }
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "value" => { "type" => "integer" },
        "reconstruction" => { "type" => %w[string null] },
      },
    }
  end
end
