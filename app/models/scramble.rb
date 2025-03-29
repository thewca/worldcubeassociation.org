# frozen_string_literal: true

class Scramble < ApplicationRecord
  self.table_name = "Scrambles"
  belongs_to :competition, foreign_key: "competitionId"

  validates :groupId, format: { presence: true, with: /\A[A-Z]+\Z/, message: "Invalid scramble group name" }
  validates :eventId, presence: true
  validates :roundTypeId, presence: true
  validates :scramble, presence: true
  validates :scrambleNum, numericality: { presence: true, greater_than: 0 }
  validates :isExtra, inclusion: { presence: true, in: [true, false] }

  def round_type
    RoundType.c_find(roundTypeId)
  end
end
