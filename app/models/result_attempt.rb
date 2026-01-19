# frozen_string_literal: true

class ResultAttempt < ApplicationRecord
  include Comparable

  default_scope { order(:attempt_number) }

  belongs_to :result
  has_one :h2h_attempt, optional: true

  validates :value, presence: true
  validates :value, numericality: { only_integer: true }
  validates :attempt_number, numericality: { only_integer: true }
  validates :attempt_number, uniqueness: { scope: :result_id }

  def <=>(other)
    value <=> other.value
  end
end
