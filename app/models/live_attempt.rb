# frozen_string_literal: true

class LiveAttempt < ApplicationRecord
  belongs_to :live_result

  validates :result, numericality: { only_integer: true }
  validates :attempt_number, numericality: { only_integer: true }

  belongs_to :replaces, class_name: "LiveAttempt", optional: true

  def serializable_hash(options = nil)
    result
  end
end
