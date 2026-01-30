# frozen_string_literal: true

class ResultAttempt < ApplicationRecord
  include Comparable

  default_scope { order(:attempt_number) }

  belongs_to :result, inverse_of: :result_attempts
  has_one :h2h_attempt

  scope :completed, -> { where.not(value: ..0) }

  validates :value, presence: true, numericality: { only_integer: true }
  validates :attempt_number, numericality: { only_integer: true }, uniqueness: { scope: :result_id }

  def <=>(other)
    value <=> other.value
  end
end
