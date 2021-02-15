# frozen_string_literal: true

class Scramble < ApplicationRecord
  self.table_name = "Scrambles"
  belongs_to :competition, foreign_key: "competitionId"

  validates_format_of :groupId, presence: true, with: /\A[A-Z]+\Z/, message: "Invalid scramble group name"
  validates_presence_of :eventId
  validates_presence_of :roundTypeId
  validates_presence_of :scramble
  validates_numericality_of :scrambleNum, presence: true, greater_than: 0
  validates_inclusion_of :isExtra, presence: true, in: [true, false]

  def round_type
    RoundType.c_find(roundTypeId)
  end
end
