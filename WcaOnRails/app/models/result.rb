# frozen_string_literal: true
class Result < ActiveRecord::Base
  self.table_name = "Results"

  belongs_to :competition, foreign_key: :competitionId
  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId

  scope :podium, -> { where(roundId: Round.final_rounds.map(&:id), pos: [1..3]).where("best > 0") }

  def to_s(field)
    SolveTime.new(eventId, field, send(field)).clock_format
  end
end
