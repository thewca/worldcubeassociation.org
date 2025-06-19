# frozen_string_literal: true

class DuplicateCheckerJob < ApplicationRecord
  has_many :potential_duplicate_people, dependent: :destroy
  belongs_to :competition

  enum :status, {
    not_started: 'not_started',
    in_progress: 'in_progress',
    success: 'success',
    failed: 'failed',
  }, prefix: true

  def similar_persons
    potential_duplicate_people.order(score: :desc)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[similar_persons],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
