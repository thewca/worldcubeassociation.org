# frozen_string_literal: true

class LinkedRound < ApplicationRecord
  has_many :rounds
  has_many :results, through: :rounds
  has_many :competitions, through: :rounds
  has_many :events, through: :rounds

  validates :competition_ids, length: { is: 1, message: "must all belong to the same competition" }
  validates :event_ids, length: { is: 1, message: "must all belong to the same event" }

  validate :all_round_consistency
end
