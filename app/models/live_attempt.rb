# frozen_string_literal: true

class LiveAttempt < ApplicationRecord
  include Comparable

  # If the Attempt has been replaced, it no longer points to a live_result, but instead is being pointed to
  # by another Attempt
  belongs_to :live_result, optional: true
  belongs_to :replaced_by, class_name: "LiveAttempt", optional: true
  validate :needs_live_result_or_replaced_by

  belongs_to :entered_by, class_name: 'User'

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

  def needs_live_result_or_replaced_by
    if replaced_by.nil? && live_result.nil?
      errors.add(:replaced_by, "When unlinking an attempt from a live result you need to set replaced_by")
    end
  end
end
