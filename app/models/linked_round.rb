# frozen_string_literal: true

class LinkedRound < ApplicationRecord
  has_many :rounds
  has_many :results, through: :rounds
  has_many :competition_events, -> { distinct }, through: :rounds

  validates :competition_event_ids, length: { maximum: 1, message: "must all belong to the same competition" }
end
