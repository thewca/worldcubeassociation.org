# frozen_string_literal: true

class ExternalScrambleSet < ApplicationRecord
  SERIALIZATION_INCLUDES = { external_scrambles: [], scramble_file_upload: [] }.freeze

  default_scope { order(:event_id, :round_number, :scramble_set_number) }

  belongs_to :competition
  belongs_to :event

  belongs_to :scramble_file_upload

  has_many :external_scrambles, dependent: :destroy
  has_many :matched_scramble_sets, dependent: :delete_all

  delegate :original_filename, :generated_at, :uploaded_at, to: :scramble_file_upload

  def event
    Event.c_find(self.event_id)
  end

  def alphabetic_group_index
    Scramble.prefix_for_index(self.scramble_set_number - 1)
  end

  def automatch_wcif_id
    "#{self.event_id}-r#{self.round_number}"
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[original_filename generated_at uploaded_at automatch_wcif_id],
    include: %w[external_scrambles],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
