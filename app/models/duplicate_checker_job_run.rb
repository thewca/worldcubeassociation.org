# frozen_string_literal: true

class DuplicateCheckerJobRun < ApplicationRecord
  has_many :potential_duplicate_persons, -> { order(score: :desc) }, dependent: :destroy
  belongs_to :competition

  default_scope -> { order(start_time: :desc) }

  enum :run_status, {
    not_started: 'not_started',
    in_progress: 'in_progress',
    success: 'success',
    failed: 'failed',
    long_running_uncertain: 'long_running_uncertain',
  }, prefix: true, default: :not_started

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[potential_duplicate_persons],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
