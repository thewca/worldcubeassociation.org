# frozen_string_literal: true

class ExternalScrambleSet < ApplicationRecord
  SERIALIZATION_INCLUDES = { external_scrambles: [], scramble_file_upload: [] }.freeze

  belongs_to :competition
  belongs_to :event

  belongs_to :scramble_file_upload

  has_many :external_scrambles, dependent: :destroy
  has_many :matched_scramble_sets, dependent: :nullify

  delegate :original_filename, to: :scramble_file_upload, allow_nil: true

  def event
    Event.c_find(self.event_id)
  end

  def alphabetic_group_index
    Scramble.prefix_for_index(self.scramble_set_number - 1)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[original_filename],
    include: %w[external_scrambles],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
