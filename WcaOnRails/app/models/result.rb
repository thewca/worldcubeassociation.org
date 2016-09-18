# frozen_string_literal: true
class Result < ActiveRecord::Base
  self.table_name = "Results"

  belongs_to :competition, foreign_key: :competitionId
  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :personId
  belongs_to :round, foreign_key: :roundId
  belongs_to :event, foreign_key: :eventId
  has_one :country, through: :person
  has_one :format, primary_key: "formatId", foreign_key: "id"

  scope :podium, -> { joins(:round).merge(Round.final_rounds).where(pos: [1..3]).where("best > 0") }
  scope :winners, -> { joins(:round, :event).merge(Round.final_rounds).where("pos = 1 and best > 0").order("Events.rank") }

  def to_s(field)
    SolveTime.new(eventId, field, send(field)).clock_format
  end
end
