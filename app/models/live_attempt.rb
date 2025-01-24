# frozen_string_literal: true

class LiveAttempt < ApplicationRecord
  # Associations
  belongs_to :live_result

  # Validations
  validates :result, presence: true
  validates :result, numericality: { only_integer: true }

  def serializable_hash(options = nil)
    result
  end
end
