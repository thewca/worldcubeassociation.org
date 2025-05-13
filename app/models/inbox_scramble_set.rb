# frozen_string_literal: true

class InboxScrambleSet < ApplicationRecord
  belongs_to :competition
  belongs_to :event
  belongs_to :round_type

  belongs_to :scramble_file_upload, optional: true, foreign_key: "external_upload_id", inverse_of: :inbox_scramble_sets
  belongs_to :matched_round, class_name: "Round", optional: true

  has_many :inbox_scrambles

  validates :ordered_index, uniqueness: { scope: %i[competition_id event_id round_type_id] }

  before_save :backfill_round_information!, if: :matched_round_id?

  def backfill_round_information!
    return if matched_round.blank?

    self.competition_id = matched_round.competition_id
    self.event_id = matched_round.event_id
    self.round_type_id = matched_round.round_type_id
  end
end
