# frozen_string_literal: true
class Scramble < ActiveRecord::Base
  self.table_name = "Scrambles"
  belongs_to :competition, foreign_key: "competitionId"
end
