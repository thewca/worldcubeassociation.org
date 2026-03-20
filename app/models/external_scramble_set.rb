# frozen_string_literal: true

class ExternalScrambleSet < ApplicationRecord
  SERIALIZATION_INCLUDES = { external_scrambles: [], scramble_file_upload: [] }.freeze

  belongs_to :competition
  belongs_to :event

  belongs_to :scramble_file_upload

  has_many :external_scrambles, dependent: :destroy

  delegate :original_filename, to: :scramble_file_upload, allow_nil: true

  def event
    Event.c_find(self.event_id)
  end

  def alphabetic_group_index
    prefix_for_index(self.scramble_set_number - 1)
  end

  private def prefix_for_index(index)
    char = (65 + (index % 26)).chr
    return char if index < 26

    prefix_for_index((index / 26) - 1) + char
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[original_filename],
    include: %w[external_scrambles],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
