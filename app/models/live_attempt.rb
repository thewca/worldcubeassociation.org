# frozen_string_literal: true

class LiveAttempt < ApplicationRecord
  # If the Attempt has been replaced, it no longer points to a live_result, but instead is being pointed to
  # by another Attempt
  belongs_to :live_result, optional: true

  validates :result, numericality: { only_integer: true }
  validates :attempt_number, numericality: { only_integer: true }

  belongs_to :replaces, class_name: "LiveAttempt", optional: true

  def serializable_hash(options = nil)
    result
  end
end
