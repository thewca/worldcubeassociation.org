# frozen_string_literal: true

class DuplicateCheckerJobRun < ApplicationRecord
  has_many :potential_duplicate_people, -> { order(score: :desc) }, dependent: :destroy
  belongs_to :competition

  default_scope -> { order(start_time: :desc) }

  enum :status, {
    not_started: 'not_started',
    in_progress: 'in_progress',
    success: 'success',
    failed: 'failed',
  }, prefix: true, default: :not_started

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[potential_duplicate_people],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
