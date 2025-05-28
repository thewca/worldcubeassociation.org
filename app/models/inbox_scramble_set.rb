# frozen_string_literal: true

class InboxScrambleSet < ApplicationRecord
  belongs_to :competition
  belongs_to :event

  belongs_to :scramble_file_upload, optional: true, foreign_key: "external_upload_id", inverse_of: :inbox_scramble_sets
  belongs_to :matched_round, class_name: "Round", optional: true

  has_many :inbox_scrambles, dependent: :destroy

  validates :scramble_set_number, uniqueness: { scope: %i[competition_id event_id round_number] }

  before_validation :backfill_round_information!, if: :matched_round_id?

  def backfill_round_information!
    return if matched_round.blank?

    self.competition_id = matched_round.competition_id
    self.event_id = matched_round.event_id
    self.round_number = matched_round.number
  end

  def matched_round_wcif_id
    matched_round&.wcif_id || "#{self.event_id}-r#{self.round_number}"
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
    methods: %w[matched_round_wcif_id],
    include: %w[inbox_scrambles],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
