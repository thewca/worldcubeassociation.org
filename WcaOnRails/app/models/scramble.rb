# frozen_string_literal: true

class Scramble < ApplicationRecord
  self.table_name = "Scrambles"
  belongs_to :competition, foreign_key: "competitionId"

  validates_format_of :groupId, presence: true, with: /\A[A-Z]+\Z/, message: "Invalid scramble group name"
end
