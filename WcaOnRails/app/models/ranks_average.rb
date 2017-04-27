# frozen_string_literal: true

class RanksAverage < ApplicationRecord
  include PersonalBest
  self.table_name = "RanksAverage"

  def to_wcif
    rank_to_wcif("average")
  end

  def to_s(field)
    SolveTime.new(eventId, :average, send(field)).clock_format
  end
end
