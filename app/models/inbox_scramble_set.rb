# frozen_string_literal: true

class InboxScrambleSet < ApplicationRecord
  SERIALIZATION_INCLUDES = { inbox_scrambles: [], scramble_file_upload: [], matched_round: [:competition_event] }.freeze

  belongs_to :competition, inverse_of: :inbox_scramble_sets
  belongs_to :event

  belongs_to :scramble_file_upload, optional: true, foreign_key: "external_upload_id", inverse_of: :inbox_scramble_sets
  belongs_to :matched_round, class_name: "Round", optional: true, inverse_of: :matched_scramble_sets

  has_many :inbox_scrambles, inverse_of: :inbox_scramble_set, dependent: :destroy
  has_many :matched_inbox_scrambles, -> { order(:ordered_index) }, class_name: "InboxScramble", inverse_of: :matched_scramble_set, dependent: :nullify

  validates :ordered_index, uniqueness: { scope: :matched_round_id, if: :matched_round_id? }

  delegate :round_type_id, to: :matched_round, allow_nil: true
  delegate :wcif_id, to: :matched_round, allow_nil: true, prefix: true
  delegate :original_filename, to: :scramble_file_upload, allow_nil: true

  def event
    Event.c_find(self.event_id)
  end

  def alphabetic_group_index
    prefix_for_index(ordered_index)
  end

  def prefix_for_index(index)
    char = (65 + (index % 26)).chr
    return char if index < 26

    prefix_for_index((index / 26) - 1) + char
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    except: %w[matched_round_id],
    methods: %w[matched_round_wcif_id original_filename],
    include: %w[inbox_scrambles],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
